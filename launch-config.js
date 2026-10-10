// Public information only. Never put credentials or wallet secrets here.
// Set a URL only after the founder verifies the exact destination and ownership.
// TOKEN_LIVE_VERIFIED may be true only after independently verifying the mint,
// issuer, chain, and both platform/chart mappings. See README.md.
export const publicLaunchConfig = Object.freeze({
  MINT_ADDRESS: null,
  PUMP_FUN_URL: null,
  X_URL: null,
  CHART_URL: null,
  DOMAIN_URL: null,
  TOKEN_LIVE_VERIFIED: false,
});

export function verifiedHttpsUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

// Fail closed if a supposedly verified platform/chart URL does not contain
// the exact mint as a path segment or query value. Pair-only URLs need a
// separately implemented verification record before this policy can change.
function mintUrl(value, mint) {
  const safe = verifiedHttpsUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  try {
    const values = [...url.pathname.split('/').map(decodeURIComponent), ...url.searchParams.values()];
    return values.includes(mint) ? safe : null;
  } catch {
    return null;
  }
}

export function launchState(config) {
  const mint = typeof config.MINT_ADDRESS === 'string' && /^[A-Za-z0-9]{20,128}$/.test(config.MINT_ADDRESS)
    ? config.MINT_ADDRESS : null;
  const verified = config.TOKEN_LIVE_VERIFIED === true && mint !== null;
  return {
    mint: verified ? mint : null,
    live: verified,
    buy: verified ? mintUrl(config.PUMP_FUN_URL, mint) : null,
    chart: verified ? mintUrl(config.CHART_URL, mint) : null,
    social: verifiedHttpsUrl(config.X_URL),
    domain: verifiedHttpsUrl(config.DOMAIN_URL),
  };
}
