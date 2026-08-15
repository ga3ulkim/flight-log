# Flight Log Phase 2 report

## Outcome

Phase 2 improves the internal boundaries and automated verification of the migrated Flight Log without redesigning the application or changing its local CSV/Excel workflow.

The final validation gate passes:

- `npm run lint`: passed with no errors or warnings.
- `npm run test`: 5 test files passed, 42 tests passed.
- `npm run build`: passed.
- `npm run typecheck`: passed with no TypeScript errors.
- The Phase 1 headless browser regression suite passed against the refactored production build with zero runtime exceptions and zero console errors.

## Refactoring performed

### Pure application logic

- `src/lib/dateIata.ts`
  - Owns partial date parsing and standalone IATA extraction.
  - Keeps the reference date display and lexical `sortKey` behavior.
- `src/lib/fileParser.ts`
  - Owns browser `File` reading, CSV encoding fallback, CSV/XLS/XLSX workbook creation, and handoff to the workbook parser.
  - Files still flow from `File.arrayBuffer()` directly to SheetJS in the browser. No transport layer was added.
- `src/lib/parser.ts`
  - Owns worksheet/header detection, column mapping, row conversion, route-type determination, and aircraft-alternative normalization.
  - Exposes row-level pure functions so header and normalization behavior can be tested without a browser.
- `src/lib/analytics.ts`
  - Owns filtering, available years, route keys, airport/country/city/airline aggregation, live playback analytics, rankings, and top map labels.
- `src/lib/geography.ts`
  - Owns projection constants, known-airport lookup, Haversine distance, route arc geometry, quadratic evaluation, world normalization, nearest-world-copy selection, wrap-toward behavior, and route-dependent camera scale.
- `src/lib/playback.ts`
  - Owns chronological sequence construction, connected-flight determination, flight and ground-transfer durations, one-frame playback advancement, and already-flown route keys.
  - The pure advancement function deliberately advances at most one transition per call, matching the original rAF behavior.

### Domain types

`src/types.ts` now contains typed representations for:

- flights and flight types;
- IATA codes and route keys;
- date parsing results;
- camera and playback state/progress;
- airport usage and route aggregation;
- complete and live analytics;
- filters, ranking tabs, and ranking entries;
- parser results.

The airport and land data retain explicit tuple order types in their existing static data modules.

### UI responsibilities

- `FlightLogChart.tsx` retains application state, file-load state transitions, pointer gestures, wheel handling, the rAF loop, camera following, and fixed per-segment wrap offset.
- `FlightMap.tsx` owns the SVG world, graticule, land, routes, airport markers/labels, map controls, route selection presentation, and placement of playback overlays.
- `AircraftMarker.tsx` owns aircraft categorization, the existing silhouette geometry, and disconnected-flight bus rendering.
- `PlaybackUI.tsx` owns play/pause, stop, speed controls, and current-flight presentation. Playback transition logic stays in the parent/pure helper rather than in the presentational component.
- `StatisticsPanel.tsx` owns summary cards and ranking presentation.
- `RouteDetail.tsx` owns the selected-route flight strip.
- `uiPrimitives.tsx` contains the two small reused visual primitives.
- `theme.ts` centralizes the unchanged palette, font stacks, and component CSS.

The main orchestrator remains intentionally cohesive. Pointer refs, camera refs, follow timing, world-offset refs, and the animation effect were not spread across multiple hooks/components because their lifecycle and closure relationships are the behavior being protected.

## React hooks and animation review

### Stale closures

- The rAF effect depends on `play.on`, playback speed, and the chronological sequence.
- Frame progress is read from `playRef`; the current camera is read from `camRef`; gesture/follow state uses refs. This retains the reference solution to stale animation closures.
- Camera updates remain functional state updates.
- The selected-route distance is now memoized instead of being recalculated on camera-only renders.

### Listener cleanup

- The SVG wheel listener remains non-passive and is removed by its effect cleanup.
- Window pointer listeners are still installed only when the first pointer begins and removed when the final pointer ends or is cancelled.
- A concrete cleanup gap was fixed: an unmount during an active pointer gesture now removes all window pointer listeners and clears gesture state.
- Pointer capture was not introduced because it would risk the existing route-click behavior.

### Animation cleanup

- The rAF effect retains explicit `cancelAnimationFrame` cleanup on dependency changes and unmount.
- Speed or sequence changes cancel the previous loop before a replacement loop starts.
- The pure playback step was extracted, but camera easing, follow override, route-dependent zoom, and fixed world-copy offset remain structurally unchanged.

### Rerender review

- Static land SVG paths are now generated once at module initialization.
- Filtering, analytics, rankings, chronological sorting, played routes, and top labels remain memoized.
- The map still rerenders during playback and camera movement because its viewBox, active route, marker, and camera-relative symbol sizes genuinely change each frame.
- Live analytics still update with playback progress as before; no throttling was introduced.

## Automated tests added

All fixtures are deliberately synthetic. No row or value was copied from `flights.csv` or the legacy inline history.

| Test file | Tests | Coverage |
| --- | ---: | --- |
| `dateIata.test.ts` | 8 | Missing/year-only/dotted/Korean dates; bare, labeled, multiple, and invalid IATA values |
| `parser.test.ts` | 10 | Reordered and offset headers, 12-row scan limit, CSV workbook, XLSX-style workbook, missing headers, explicit/inferred route type, aircraft normalization, invalid row skipping, UTF-8 decode |
| `analytics.test.ts` | 8 | Airport aggregation, country aggregation, airline ranking, undirected route aggregation, airport ranking labels, unknown airports, top labels, partial live distance |
| `geography.test.ts` | 7 | Haversine distance, world normalization, dateline wrapping, nearest segment offset, short dateline arc, quadratic endpoints, route-dependent scale |
| `playback.test.ts` | 9 | Chronological sorting, invalid/same-airport exclusion, connected/disconnected flights, direct transition, ground hold creation/completion, final stop, empty sequence, duration clamps, flown route keys |
| **Total** | **42** | **All required Phase 2 categories covered** |

Vitest runs in its Node environment because the required cases target pure logic. No DOM emulator or React testing library was needed for those cases.

## Commands and results

```text
npm install --save-dev vitest@^4.1.0
npm run typecheck
npm run lint
npm run test
npm run build
node .tools/browser-smoke.mjs
```

The local machine still uses the ignored portable Node 22.22.0 toolchain documented in Phase 1 because Node/npm is not globally available on `PATH`.

### Test result

```text
Test Files  5 passed (5)
Tests       42 passed (42)
```

Vitest version: 4.1.0.

### Lint and type result

- ESLint: passed with no errors or warnings.
- TypeScript project build/no-emit validation: passed with no errors.

### Build result

- Vite 6.4.3 production build: passed.
- 44 modules transformed.
- `index.html`: 0.54 kB.
- CSS: 0.07 kB.
- JavaScript: 562.83 kB, 190.53 kB gzip.
- Vite's existing non-failing warning for a minified chunk over 500 kB remains. SheetJS is still the main contributor, and code splitting was not mixed into this behavior-focused phase.

### Browser regression result

The existing local headless Chrome suite was rerun against `dist` after refactoring. It exercised:

- the upload and synthetic-sample screens;
- the private local Korean CSV without exposing its rows;
- synthetic UTF-8 CSV drag/drop;
- synthetic XLS and XLSX input;
- flexible headers and IATA labels;
- filters, summary totals, all ranking tabs, and route details;
- map reset/zoom, wheel, pan, and pinch event paths;
- chronological playback, play/pause/stop, 2x transition, live statistics, and flown routes;
- disconnected-flight bus transfer;
- short/long route camera scales, manual follow override, follow reacquisition, and dateline anti-jitter behavior.

Results: zero runtime exceptions, zero console errors, and zero post-file-input network requests.

## Privacy verification

- `flights.csv` remains ignored and local-only.
- No private CSV/XLS/XLSX file exists under `src`, `dist`, or `public`.
- No legacy 68-flight history marker exists in `src` or `dist`.
- No file/network transport API was introduced in application source.
- Test fixtures use fictional countries, cities, carriers, flight numbers, and future dates.
- The original local reference files remain unchanged; their Phase 1 hashes still match.

## Remaining browser/manual checks

- Use the native OS picker and physical drag-and-drop with representative personal exports.
- Exercise physical touch pinch/pan transitions and a real mouse/trackpad wheel across target devices.
- Watch a long real-data playback across multiple connected/disconnected segments and world wraps.
- Visually inspect all aircraft silhouette categories and the full 1x → 2x → 4x → 1x speed cycle.
- Compare true Excel date/time cells near timezone/day boundaries because the Phase 1 SheetJS 0.20.x date risk remains.
- Check responsive behavior in other target browsers and on mobile-sized screens.
- A future component-level test layer could explicitly mount/unmount during an active pointer gesture. The cleanup is present and lint/type/browser checks pass, but that exact unmount scenario is not currently automated.

## Regression risks

- `FlightMap` and the presentational panels now receive typed props instead of closing over all parent state. The full browser smoke pass reduces but does not eliminate visual/event-propagation risk from that boundary change.
- Camera easing and the rAF scheduler are time-based browser behavior; unit tests verify the pure transition rules, not frame pacing under every device load.
- The fixed `worldOffRef` invariant remains in the orchestrator. Future refactors must continue choosing the nearest offset only when the flight/ground segment changes.
- The existing copy says follow resumes after three seconds while the preserved code uses two seconds. This pre-existing mismatch was not changed.
- SheetJS's official tarball and the large bundle warning remain the dependency/build risks described in Phase 1.

No visual redesign, backend, authentication, database, deployment preparation, or CSV-workflow replacement was performed.
