# Flight Log Phase 3 report

## Outcome

Phase 3 turns the validated visualization utility into a cohesive personal flight archive website without changing the local-file product concept. The CSV/XLS/XLSX workflow, custom SVG world map, route selection, statistics, pointer controls, and regression-sensitive playback/camera implementation remain in place.

The Phase 3 validation gate passes:

- `npm run lint`: passed with no errors or warnings.
- `npm run test`: 6 files passed, 49 tests passed.
- `npm run typecheck`: passed with no TypeScript errors.
- `npm run build`: passed.
- The broad production-browser regression, responsive QA, and error-state QA passed with zero runtime exceptions and zero console errors.

## Visual changes

- Reworked the pre-file screen as a Korean-first Personal Flight Log landing experience with a larger identity statement, an explicit local-only privacy seal, a clear file-format line, a polished drag/drop area, and a more visible synthetic-data action.
- Expanded the loaded page from a compact 860 px utility layout to a restrained 1180 px personal archive layout.
- Added a dynamic archive identity header. The earliest and latest valid years, flight count, and distance are calculated from the loaded file; no example values are hard-coded.
- Reframed the existing filtered/live metrics as the personal summary while retaining flight, distance, country, airport, domestic/international, and Earth-circumference values.
- Gave the custom world map greater desktop prominence while preserving its geography, route colors, world copies, projection, viewBox math, and interaction model.
- Made `PLAY MY JOURNEY` a prominent control and added a non-seekable progress indicator plus clearer date, route, airline, flight number, aircraft, and ground-transfer presentation.
- Improved route-detail hierarchy and narrow-screen row wrapping without changing undirected route aggregation or route-click behavior.
- Reframed the existing ranking tabs as a cohesive Travel Insights section without changing their aggregation semantics.
- Added a method/privacy footer that accurately describes the simplified coastline, great-circle distance estimate, local browser processing, and absence of an application upload endpoint/account/database.
- Kept the established cream paper, pale-blue sea, warm land, navy ink, magenta international, blue domestic, and gold active visual language. No third-party map or generic dashboard theme was introduced.

## Flight Timeline

- Added a chronological archive derived directly from the already-filtered flight list, so the existing year and domestic/international filters remain the only filter system.
- Groups records by year and presents years and flights newest-first for archive browsing.
- Shows only available date, route, city, airline, flight number, aircraft, and domestic/international values.
- Keeps unknown-coordinate flights in the archive because those rows are still valid records, even though map geometry and playback cannot use them.
- Preserves partial date precision and places undated records in an explicit `날짜 미상` group rather than inventing dates.
- Uses semantic year sections, ordered lists, articles, headings, and `time` elements.

## Responsive changes

Automated viewport inspection and screenshots covered:

| Viewport | Horizontal overflow | Map width/height | Smallest visible button | Mobile playback layout |
| --- | --- | --- | --- | --- |
| 360 × 780 | none | 360 × 134 | 44 px | controls below map |
| 390 × 844 | none | 390 × 145 | 44 px | controls below map |
| 768 × 1024 | none | 738 × 275 | 44 px | overlay layout retained |
| 1366 × 850 | none | 1178 × 438 | 44 px | desktop layout |
| 1920 × 1080 | none | 1178 × 438 | 44 px | capped wide layout |

On phones, playback metadata and controls move below the intrinsic-ratio SVG instead of obscuring the small world map. Statistics use two columns, filter groups wrap or scroll intentionally, route detail stacks metadata, the timeline becomes a single-column archive, and long text can wrap. The SVG aspect ratio and client-to-map math were deliberately not changed because arbitrary cropping or stretching would make cursor-centered zoom and pointer translation inaccurate.

## Accessibility changes

- Added semantic `main`, `header`, `nav`, `section`, heading, footer, list, article, and time structure.
- Added `aria-pressed` to filter/ranking chips and labels for filter groups and map/playback controls.
- Made the central-world route paths keyboard-selectable with Enter or Space; duplicate wrapped-world paths do not enter the tab order.
- Kept the map, zoom, playback, speed, stop, and reset labels used by assistive technology and regression automation.
- Added `role="alert"` to file errors, status/empty messaging for partial results, and a disabled playback state when no coordinate-complete route is available.
- Increased interactive targets to at least 44 px and retained visible focus styles.
- Expanded reduced-motion CSS to eliminate decorative pulses and transition motion. Playback itself remains user-initiated.

## Copy correction

The visible camera-follow help and the adjacent source comment now state that follow resumes after **two seconds**. The validated `2000 ms` behavior was not changed.

## Tests added or changed

Seven synthetic tests were added:

- 5 timeline tests: descending year/date grouping, same-day ordering, input immutability, missing-date grouping, filter-ready subsets, and full/partial/missing display precision.
- 2 file-kind tests: case-insensitive CSV/XLS/XLSX acceptance and unsupported-file rejection.

All test data remains clearly fictional. No personal flight row was copied into tests or application source.

## Exact automated validation

Commands run against the Phase 3 production candidate:

```text
npm run lint
npm run test
npm run typecheck
npm run build
```

Results:

```text
ESLint:       PASS — 0 errors, 0 warnings
Vitest:       PASS — 6 files, 49 tests
TypeScript:   PASS — strict project build, 0 errors
Vite build:   PASS — 47 modules transformed
index.html:   0.68 kB (0.47 kB gzip)
CSS:          21.47 kB (4.54 kB gzip)
JavaScript:   567.96 kB (192.05 kB gzip)
```

The existing non-failing Vite warning for a minified JavaScript chunk larger than 500 kB remains at the Phase 3 gate. SheetJS is still the main contributor; production optimization is evaluated separately in Phase 4.

## Production-browser QA performed

The Phase 2 CDP/Chrome regression harness was rerun against `npm run preview` output and passed:

- landing and synthetic sample;
- local private Korean/CP949 CSV selection without printing any row values;
- synthetic UTF-8 CSV drag/drop;
- synthetic XLS and XLSX input-selection paths;
- flexible header/IATA/date/type parsing checks;
- year and domestic/international filters;
- flight, distance, country, airport, and ranking results;
- route selection and route detail;
- zoom buttons, wheel zoom, pan, pinch event path, and reset;
- chronological start, pause, resume, stop, and the 2× speed transition;
- active aircraft, live statistics, flown routes, disconnected ground bus;
- short/long route camera scale, manual override, two-second follow reacquisition, and dateline continuity.

Additional browser automation verified:

- the five responsive viewports in the table above;
- landing, map, and timeline screenshots at every viewport;
- no obvious horizontal overflow;
- unsupported file, missing header, no valid IATA, broken workbook, empty filter, and partial unknown-coordinate states;
- unknown-coordinate rows remained in counts/timeline while known routes still rendered;
- zero post-file-selection application network requests in every local-file scenario;
- zero runtime exceptions and zero console errors.

## Remaining physical-device/manual checks

- Native Windows/macOS file-picker chrome itself was not automated; CDP exercised the input-selection event path.
- Physical drag/drop from the operating system was not performed; the browser DragEvent/DataTransfer path was automated.
- A real touch panel is still needed for tactile two-finger pinch/pan assessment; the two-pointer event path passed in Chrome.
- Physical 360/390 px devices and additional mobile browsers should confirm font rendering, scrolling feel, and the intentionally compact intrinsic-ratio map.
- A long real-history replay under different GPU/load conditions and visual inspection of every aircraft silhouette remain manual checks.
- True Excel date/time cells around timezone/day boundaries retain the documented SheetJS 0.20.x manual risk.

No backend, database, authentication, cloud persistence, route system, or external deployment was added in Phase 3.
