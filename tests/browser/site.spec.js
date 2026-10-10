import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

for (const width of [320, 375, 768, 1440]) {
  test(`complete layout, asset, and navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('THE FREEZER COULDN’T KILL IT.');
    await expect(page.locator('#launch-label')).toHaveText('NOT LIVE / ADDRESS NOT VERIFIED');
    await expect(page.locator('#launch-actions')).toBeHidden();
    await expect(page.locator('a[href^="http"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    const dimensions = await page.locator('.hero-art img').evaluate(image => ({ complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, fit: getComputedStyle(image).objectFit }));
    expect(dimensions).toEqual({ complete: true, naturalWidth: 1024, naturalHeight: 1024, fit: 'contain' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('details').evaluateAll(elements => elements.forEach(element => element.open = true));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('details').evaluateAll(elements => elements.forEach(element => element.open = false));
    const screenshot = testInfo.outputPath(`layout-${width}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    await testInfo.attach(`layout-${width}`, { path: screenshot, contentType: 'image/png' });
    await page.getByRole('link', { name: 'ENTER THE FREEZER' }).click();
    await expect(page).toHaveURL(/#story$/);
    await page.getByRole('link', { name: 'SEE THE MEMES' }).click();
    await expect(page).toHaveURL(/#memes$/);
    for (const [name, anchor] of [['Story', 'story'], ['Memes', 'memes'], ['Status', 'status']]) {
      await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
    }
    expect(errors).toEqual([]);
  });
}

test('all locked content is visible or available through disclosure', async ({ page }) => {
  await page.goto('/');
  await page.locator('details').evaluateAll(elements => elements.forEach(element => element.open = true));
  const copy = await readFile(new URL('../../docs/FREEZERBURN_LOCKED_COPY_v1.md', import.meta.url), 'utf8');
  const visible = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const blocks = [
    copy.split('## Narrative (83 words)\n')[1].split('\n\n')[0].trim(),
    copy.split('## Exact footer disclaimer\n')[1].split('\n\n')[0].trim(),
    'THE FREEZER COULDN’T KILL IT.',
    'One forgotten pizza slice. A lifetime of freezer burn. Zero plans to thaw.',
    'The shelf got cleared. The coldest slice stayed behind. Nobody ordered a comeback; it happened anyway.',
    'It speaks in freezer-door threats, subzero grudges, and terrible snack puns. The mitten is not a peace offering.',
    'Remix the slice. Pass on the joke. Any token or chart links stay inactive until a real launch and verified addresses exist.',
    'No. FREEZERBURN is independent fictional satire, not affiliated with any pizza brand or manufacturer.',
    'No utility or financial returns are promised. Any future memecoin would be highly speculative and could lose all value.',
    'No mint address has been supplied or verified. Do not trust lookalike contracts or unofficial links.',
  ];
  for (const text of blocks) expect(visible).toContain(text);
  await expect(page.locator('.punchline')).toHaveCount(5);
});

test('clipboard copies exact punchline and reports real success', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy: Cold take. Hot slice.' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied to clipboard.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Cold take. Hot slice.');
});

test('clipboard denial selects the exact text with manual instructions', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied'); } } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Copy: One mitten. Zero forgiveness.' }).click();
  await expect(page.getByRole('status')).toContainText('Clipboard unavailable. Text selected');
  expect(await page.evaluate(() => window.getSelection().toString())).toBe('One mitten. Zero forgiveness.');
});

test('keyboard navigation, disclosures, and visible focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  const summary = page.locator('.more-memes summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.extra-memes')).toBeVisible();
  const copy = page.getByRole('button', { name: 'Copy: Last seen behind the peas.' });
  await copy.focus();
  expect(await copy.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  const faq = page.locator('.faq-list summary').first();
  await faq.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.faq-list details').first().locator('p')).toBeVisible();
});

test('reduced motion disables scrolling and hover transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  expect(await page.locator('.meme-card').first().evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
});

test('accessibility scan with all content expanded', async ({ page }) => {
  await page.goto('/');
  await page.locator('details').evaluateAll(elements => elements.forEach(element => element.open = true));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});

test('site remains usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#launch-label')).toContainText('NOT LIVE');
  await expect(page.locator('[data-copy]').first()).toBeHidden();
  await page.getByRole('link', { name: 'ENTER THE FREEZER' }).click();
  await expect(page).toHaveURL(/#story$/);
  await page.locator('.faq-list summary').first().click();
  await expect(page.locator('.faq-list details').first().locator('p')).toBeVisible();
  await context.close();
});
