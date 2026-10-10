# FREEZERBURN

Static, single-page fictional satire site built from the approved v1 handoff. The original approved PNG and locked copy are preserved. There are no runtime packages, trackers, wallet integrations, or external fonts.

## Develop and validate

Node.js 22+ is required (validated with Node 24). From this directory:

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

The server listens on port 4173, on loopback by default. `HOST` and `PORT` override the development binding if needed. The site works as ordinary static files on any static host.

```sh
npm run lint
npm test
npm run build
npm run test:browser
```

The build writes only public site files to `dist/`. `npm run preview` serves that output. Browser tests start and stop their own preview server; leave port 4173 free before running them, or use `PORT=4174 npm run test:browser` while the development server runs. Playwright uses `/usr/bin/chromium` when present, or `CHROMIUM_PATH` if provided. On other machines, run `npx playwright install chromium` to install its supported browser. Browser QA covers 320, 375, 768, and 1440px, navigation, approved copy, clipboard success/denial, keyboard access, reduced motion, no-JavaScript fallback, and axe accessibility. Screenshots are in `test-results/` after a run.

## Public launch configuration

All five public fields and `TOKEN_LIVE_VERIFIED` are in `launch-config.js`. They start as `null` and `false`. The page displays pending status and has no social, buy, chart, or contract-copy action.

The founder must supply and independently verify the exact mint, chain, issuer identity, matching platform/chart URLs, owned X URL, and owned domain before editing the corresponding fields. Set `TOKEN_LIVE_VERIFIED` only after the complete mint verification in the founder packet. This flag records a manual verification decision; browser code does not prove on-chain ownership.

URLs must use HTTPS without embedded credentials. Buy/chart URLs also must contain the exact mint as a full path segment or query value. A chart that resolves via a different pair ID needs a separately implemented verification record; it is deliberately omitted under the current policy. Mint without a true verification flag stays hidden. Invalid or mismatched links stay absent. The live state replaces the prelaunch address FAQ to avoid contradictory information; obtain approval for postlaunch copy before activating it.

No canonical URL is emitted until the verified domain is configured. The initial OpenGraph image is a relative reference to the original 1024px avatar; a real verified domain makes it absolute. Social crawler previews require validation on the eventual deployed domain.

## Handoff provenance

`docs/FREEZERBURN_LOCKED_COPY_v1.md` is the exact supplied copy. `docs/FREEZERBURN_ASSET_MANIFEST.json` contains the original image hash. The complete extracted handoff remains alongside this repository at `/workspace/FREEZERBURN_HANDOFF_v1` in the onboarding workspace.

## Deploy to Vercel

`vercel.json` configures a static deployment: `npm ci`, `npm run build`, and `dist/` as the public output. Import this GitHub repository into Vercel, or run the Vercel CLI with the authorized account. Deployment is independent of token launch; the published site retains its pending state until the founder supplies verified information.

Account creation, domain purchases, posts, and token/wallet operations require separate explicit instructions.
