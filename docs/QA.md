# Phase 1 validation record

Date: 2026-09-07. Windows, Node 24.19.0, pnpm 11.19.0, Chrome / Chromium.

## Core verification

`pnpm test` covers 89 tests in 2 files: 69 engine and scoring tests, 20 storage and service tests. These include 100 seeded round invariant checks in addition to explicit scenarios. `pnpm typecheck` uses strict TypeScript. `pnpm build` produces a static Vite bundle.

## Browser regression

`pnpm test:e2e` contains 16 tests in `tests/game.spec.ts`:

- One-play deduction, disabled start, high-combo skip, persisted awards and sound / fast settings.
- Full animation playback for FIRE, WILD, BONUS, NO MATCH and LARGE CLUSTER.
- Reward preview without point deduction; dialog Tab cycling and Escape focus restoration.
- Zero plays, corrupted storage fallback, hidden debug and reloading during playback.
- 320 / 375 / 390 / 430 / 768 / 1440px board boundaries, all 36 cells, loaded images and no horizontal overflow.
- Start button within the 780px-high first viewport for all tested phone widths.
- Reduced motion and keyboard-only play.
- axe WCAG 2 A / AA and WCAG 2.1 AA checks on the main surface and result; mobile shop, guide and bonus dialogs. Checks wait for finite dialog entrance animation to settle.

The console and page-error collection in the complete-round test includes sound unlock, skip and reload. Image checks cover all board assets. The bundled font and explicit game favicon avoid external font dependencies and favicon 404s.

The tests create local screenshots and failure traces under ignored `test-results/` and `playwright-report/`; they are not production assets. Viewport screenshots have been visually inspected for composition and Jelly legibility. Responsive testing is browser viewport emulation, not a claim of physical iPhone / Android coverage.

## Balance observation

`pnpm balance`, deterministic seeds 0–999:

| Metric                           | Result        |
| -------------------------------- | ------------- |
| Rounds                           | 1,000         |
| No-match rounds                  | 0             |
| Safety-cap rounds                | 6 (0.6%)      |
| Mean cascades                    | 5.56          |
| Mean score                       | 1,524.999     |
| Normal animation median          | 12.06 seconds |
| Normal animation 90th percentile | 25.36 seconds |
| Longest animation                | 48.5 seconds  |

Durations sum configured event delays; they exclude browser scheduling overhead. Fast mode uses 55% of normal delays, and skip completes the predetermined result immediately. A higher-cascade tail is expected and remains bounded by 20 cascades.

## Assets and scope

The original `reference/jellyfish-3d-style-board.png` remains unchanged, SHA-256 `6da26ad0f01ad730eb52e7d360fa7c9641103ccfca6ed0859b1985dbe20a5ee2`.

Eight independent 256×256 WebP derivatives total 119,956 bytes. Production references the derivatives through a central registry; no runtime access to the original reference board.

No real member assets, redemption, API, credentials, cloud database or other repository are used. The local store is a single-tab mock and is deliberately replaceable by a server-authoritative GameService in Phase 2.
