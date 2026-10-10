import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { publicLaunchConfig, launchState, verifiedHttpsUrl } from '../launch-config.js';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const copy = await readFile(new URL('docs/FREEZERBURN_LOCKED_COPY_v1.md', root), 'utf8');

test('release config is pending and has no actionable launch links', () => {
  assert.deepEqual(publicLaunchConfig, {
    MINT_ADDRESS: null, PUMP_FUN_URL: null, X_URL: null, CHART_URL: null,
    DOMAIN_URL: null, TOKEN_LIVE_VERIFIED: false,
  });
  assert.deepEqual(launchState(publicLaunchConfig), {
    mint: null, live: false, buy: null, chart: null, social: null, domain: null,
  });
});

test('mint without verification never activates copy, buy, or chart', () => {
  const mint = 'A'.repeat(32);
  const state = launchState({ ...publicLaunchConfig, MINT_ADDRESS: mint, PUMP_FUN_URL: `https://pump.fun/coin/${mint}` });
  assert.equal(state.mint, null);
  assert.equal(state.buy, null);
  assert.equal(state.chart, null);
});

test('verified link policy rejects unsafe and mismatched destinations', () => {
  const mint = 'A'.repeat(32);
  const state = launchState({ ...publicLaunchConfig, MINT_ADDRESS: mint, TOKEN_LIVE_VERIFIED: true,
    PUMP_FUN_URL: `https://pump.fun/coin/${mint}`, CHART_URL: `https://example.com/token/${'B'.repeat(32)}` });
  assert.equal(state.mint, mint);
  assert.equal(state.buy, `https://pump.fun/coin/${mint}`);
  assert.equal(state.chart, null);
  for (const unsafe of ['javascript:alert(1)', 'http://example.com', 'https://user:secret@example.com', '#', '', null]) {
    assert.equal(verifiedHttpsUrl(unsafe), null);
  }
  assert.equal(launchState({ ...publicLaunchConfig, TOKEN_LIVE_VERIFIED: true }).live, false);
});

test('canonical narrative and five punchlines remain character-for-character', () => {
  const narrative = copy.split('## Narrative (83 words)\n')[1].split('\n\n')[0].trim();
  assert.ok(html.includes(narrative));
  const lines = copy.split('## Five exact meme lines\n')[1].split('\n\n')[0].trim().split('\n').map(line => line.slice(2));
  assert.equal(lines.length, 5);
  for (const line of lines) assert.ok(html.includes(`<p class="punchline">${line}</p>`), line);
  const disclaimer = copy.split('## Exact footer disclaimer\n')[1].split('\n\n')[0].trim();
  assert.ok(html.includes(disclaimer));
});

test('approved asset is byte-identical and has the specified dimensions', async () => {
  const bytes = await readFile(new URL('assets/brand/FREEZERBURN_logo_avatar_v1.png', root));
  const manifest = JSON.parse(await readFile(new URL('docs/FREEZERBURN_ASSET_MANIFEST.json', root)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.asset_sha256);
  assert.equal(bytes.readUInt32BE(16), 1024);
  assert.equal(bytes.readUInt32BE(20), 1024);
});

test('static fallback has no external links, fake canonical, or placeholder links', () => {
  assert.ok(!/href="(?:https?:|#")/.test(html));
  assert.ok(!/rel="canonical"/.test(html));
  assert.ok(html.includes('NOT LIVE / ADDRESS NOT VERIFIED'));
  assert.ok(html.includes('id="launch-actions" class="launch-actions" hidden'));
});
