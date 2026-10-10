import { publicLaunchConfig, launchState } from './launch-config.js';

document.documentElement.classList.add('js');

async function copyText(text, element) {
  const feedback = document.querySelector('#copy-feedback');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    feedback.textContent = 'Copied to clipboard.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    feedback.textContent = 'Clipboard unavailable. Text selected — copy it manually, or press Ctrl+C / ⌘C.';
  }
}

for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', () => {
    const text = button.closest('.meme-card').querySelector('.punchline');
    copyText(text.textContent, text);
  });
}

const state = launchState(publicLaunchConfig);
const actions = document.querySelector('#launch-actions');
function externalLink(label, url) {
  const link = document.createElement('a');
  link.className = 'button button-secondary';
  link.textContent = label;
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  actions.append(link);
  actions.hidden = false;
}
if (state.live) {
  document.querySelector('#launch-label').textContent = 'LIVE / MINT VERIFIED';
  const address = document.querySelector('#address-status');
  address.textContent = state.mint;
  document.querySelector('.status-description').textContent = 'Verified mint address. Check this exact address against the official platform and chart.';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'button button-primary';
  copy.textContent = 'Copy mint address';
  copy.addEventListener('click', () => copyText(state.mint, address));
  actions.append(copy);
  actions.hidden = false;
  // The locked prelaunch FAQ must never contradict a verified launch.
  document.querySelectorAll('.faq-list details')[2].querySelector('p').textContent = 'The verified mint address appears in the status section. Check the exact address before using any token link.';
}
if (state.buy) externalLink('View token platform', state.buy);
if (state.chart) externalLink('View chart', state.chart);
if (state.social) externalLink('Follow on X', state.social);
if (state.domain) {
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = state.domain;
  document.head.append(canonical);
  const ogUrl = document.createElement('meta');
  ogUrl.setAttribute('property', 'og:url');
  ogUrl.content = state.domain;
  document.head.append(ogUrl);
  document.querySelector('meta[property="og:image"]').content = new URL('assets/brand/FREEZERBURN_logo_avatar_v1.png', state.domain.endsWith('/') ? state.domain : `${state.domain}/`).href;
}
