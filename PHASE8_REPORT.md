# Phase 8 — Land / sea transfer animation

## Outcome

Disconnected-flight playback now keeps the validated straight, shortest-world-copy airport connection while changing only its presentation by coastline mode:

- land segment: bus icon and `지상 이동 → {IATA}`
- sea segment: ferry icon and `해상 이동 → {IATA}`
- mixed segment: the icon and status can change land → sea → land, including multiple transitions

This is explicitly presented as a visualization convention. It does not claim that the user used a bus or ferry or followed a real road/sea route.

## Geometry and transition policy

`src/lib/landSeaTransfer.ts` is a pure local geometry layer over the existing bundled `LAND` data.

- It mirrors SVG `fillRule="evenodd"`: ring parity is evaluated within each top-level polygon, and top-level polygons are combined as a union.
- Longitude is normalized for classification, while the path itself uses the same shortest-longitude rule as `wrapTowards`.
- The straight path is sampled adaptively using both angular span (about 0.25° per sample) and distance (about 20 km per sample), clamped to 16–1,024 intervals.
- Each detected coastline crossing is refined with 12 bisection steps.
- Fragments shorter than 1.25% of the animation are merged into their neighbours. Under the shared 1.3–4.8 second duration envelope this removes roughly 16–60 ms coastline noise that would otherwise cause icon flicker.
- Exact coastline points count as land for deterministic airport/coast behaviour.

The mode plan is memoized once per disconnected airport pair in `FlightMap`. The same resolved mode prop drives all three wrapped marker copies and the playback status, preventing one-frame label/icon disagreement.

## Playback and camera preservation

- Flights and transfers now share `clamp(1000 + km / 3, 1300, 4800)` symbolic pacing. The existing rAF delta-speed multiplication still provides 1×, 2×, and 4×.
- The fixed `BUS_CAMERA_SCALE = 18` path was removed.
- A transfer now uses the existing flight route-scale formula against the full wrapped straight span. Short transfers are closer and long transfers wider.
- One scale target and one `h{index}` tracking key remain active for the whole transfer, so a coastline crossing does not reset camera scale or world-copy selection.
- The fixed per-segment world offset, no-per-frame camera longitude normalization, follow easing, manual override, and two-second reacquisition remain unchanged.
- The plane, bus, and ferry keep inverse-camera sizing; bus/ferry base scale is 1.65 versus the aircraft's 1.7 category base.

No transfer route line was added. Existing current/already-flown flight-route visualization remains intact.

## Tests

Added 18 tests, bringing the suite from 67 to 85 passing tests across 10 files.

New coverage includes:

- representative bundled-map land and sea points
- invalid point coordinates
- even-odd polygon holes and coastline-boundary handling
- wrapped longitude and shortest-dateline interpolation
- all-land, all-sea, land → sea → land, and multiple-transition paths
- refined coastline crossings
- the 1.25% tiny-fragment merge rule
- exact-boundary mode selection
- shared flight/transfer duration and clamps
- flight-reference transfer camera scaling for short and long wrapped spans
- a rendered synthetic ANC → GDX transfer that produces synchronized bus → ferry → bus icons and status labels

All fixtures are synthetic or public airport/map coordinates. No personal flight rows are used in tests.

## Automated validation

Executed against the final source state:

| Command | Result |
| --- | --- |
| `npm run lint` | PASS, no warnings/errors |
| `npm run test` | PASS, 10 files / 85 tests |
| `npm run typecheck` | PASS |
| `npm run build` | PASS, 51 modules |

Production output:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| application JavaScript | 432.41 kB | 178.33 kB |
| spreadsheet parser | 369.20 kB | 125.19 kB |
| CSS | 21.71 kB | 4.59 kB |

There was no Vite oversized-chunk warning. Relative to the last documented Phase 6 build (which predates both Phase 7 and this phase), the application chunk is 5.01 kB raw / 1.89 kB gzip larger; the spreadsheet parser is unchanged.

## Production browser QA

The focused production-preview fixture used only in-memory synthetic CSV data.

- all-land NRT → HND transfer: bus + land label observed
- all-sea HNL → OGG transfer: ferry + sea label observed
- wrapped ANC → GDX transfer: observed exact compressed sequence `land → sea → land`
- mixed marker/status pairs agreed in every sampled transfer frame
- mixed transfer camera scale stayed at one route-derived displayed value, ×4.6, through both coastline changes
- adjacent marker step stayed below 2.9 map units; adjacent camera step stayed below 2.8 map units; no dateline-sized jump occurred
- equal-distance reverse flight/transfer measured duration ratio was approximately 1.01 at 2×
- post-fixture-upload application requests: 0
- runtime exceptions: 0
- console errors: 0

Screenshots of the land, sea, and final-land stages were inspected. The ferry and bus were legible and similarly restrained, and the Korean status matched each marker.

The broad production browser regression also passed:

- synthetic sample, local CP949 CSV picker path, synthetic UTF-8 CSV drop path, XLS, and XLSX
- statistics, ranking tabs, filters, route click/detail, and keyboard route selection
- zoom buttons, wheel zoom, pan, simulated pinch path, and reset
- chronological playback, pause, stop, 1× → 2× → 4× → 1×, flown routes, and live statistics
- route-dependent camera scale, manual override, two-second follow reacquisition, and flight dateline continuity
- zero post-file-selection application requests for the locally exercised CSV/XLS/XLSX inputs
- zero runtime exceptions and console errors

The private local CSV was used only for local browser QA. Its rows were not copied, logged, added to source/tests/docs, or bundled.

## Privacy and bundle checks

- Land/sea lookup reads only committed local `LAND` geometry; it performs no airport/mode API request.
- A source scan found no application `fetch`, XHR, beacon, WebSocket, EventSource, or FormData send path.
- The final `dist` contained four expected build files and no private input/reference filenames.
- The existing local file, legacy reference, Vite serving, and Git ignore protections were not changed.

## Remaining limitations

- The simplified coastline deliberately omits small islands and detailed harbour/shore geometry, so some real coastal locations may receive an approximate mode.
- Sampling plus the 1.25% merge rule intentionally suppresses very short land/sea fragments.
- The visualization does not infer actual ground/sea transport or an actual route.
- Physical touch pinch, every real mobile/browser/GPU combination, and long full-history playback still require device-level manual testing.

No commit, push, remote change, or deployment was performed.
