# Flight Log Phase 1 migration notes

## Scope and source-of-truth

This phase migrates the existing application to a local npm/Vite/React/TypeScript project without redesigning it or changing its file-upload workflow.

- `flight-log-chart.jsx` is the primary module reference.
- `flight-log-chart.html` is the standalone reference. Its application body is line-for-line identical to the JSX implementation after accounting for a 38-line wrapper offset, except that it uses React globals, omits `export default`, and mounts with `ReactDOM.createRoot`.
- The HTML-only wrapper supplies the page shell, CDN scripts, a four-second dependency boot error, and the root mount. Vite replaces the CDN/Babel boot path; the page language, viewport, root sizing, and background still need to be retained.
- Both reference files must remain unchanged and available locally.
- `flights.csv` is private local test data. It must be ignored by Git and must never be imported, copied into `src`/`public`, or represented by real rows in the bundle.

The reference files contain a detailed inline 68-flight `SR`/`SAMPLE` data set. It is not safe to assume that data is public. The migrated bundle must not copy it. If the sample-button workflow is retained, it must use a small, clearly synthetic replacement.

## Current architecture

The reference is intentionally a single React component plus static constants and small presentational helpers. This keeps several timing-sensitive systems in one closure:

1. Static palette, airport coordinates, simplified land polygons, aircraft silhouettes, and projection constants.
2. Pure parsing and geometry helpers.
3. File/load, filter, camera, selection, statistics-tab, and playback state.
4. Memoized filtered/derived data and chronological playback sequence.
5. Pointer/wheel handlers and a `requestAnimationFrame` playback/camera loop.
6. Upload screen or dashboard render, including the repeated wrapped SVG world.

For the first migration, static airport/land data and safe pure helpers may move to modules, but the camera, pointer, and playback orchestration should remain together. Aggressive component splitting would make closure/ref timing regressions harder to see.

## State and mutable-ref model

### React state

| State | Meaning | Reset/invalidation behavior |
| --- | --- | --- |
| `flights` | `null` on upload screen; parsed/sample array on dashboard | File load replaces it; “other file” returns to `null` |
| `fileName` | Display-only source label | Replaced on successful file/sample load |
| `error` | Upload/parser error text | Cleared before load and when returning to upload |
| `year` | `'all'` or a numeric year | Reset on successful load |
| `ftype` | `'all'`, `'국내선'`, or `'국제선'` | Reset on successful load |
| `cam` | `{ s, cx, cy }` scale and map-space center | Reset to whole-world view on load/reset |
| `selKey` | Undirected route key (`AAA|BBB`) or `null` | Cleared on filters, playback, background click, or close |
| `statTab` | Country/city/airport/airline ranking dimension | Persists while the dashboard is open |
| `drag` | Upload drop-zone hover state | Cleared on drag leave/drop |
| `play` | `{ on, idx, t, hold, holdTotal, speed }` | Progress resets on filter/file/stop; speed cycles 1/2/4 |

### Refs used to avoid animation/event closure lag

| Ref | Invariant |
| --- | --- |
| `fileRef` | Hidden file input used by the picker button |
| `svgRef` | Current SVG element for client-to-map conversion and wheel listener |
| `camRef` | Synchronously mirrors the latest camera so window pointer handlers and rAF see current values |
| `dragRef` | Active pointer map, pan/pinch gesture baseline, and click-suppression `moved` flag |
| `followPause` | Timestamp until which manual map input wins over automatic following |
| `playRef` | Mutable mirror of playback progress for the rAF loop |
| `trackKeyRef` | Identifies the current flight/transfer segment; world-copy selection is recomputed only when it changes |
| `worldOffRef` | Fixed `-W`, `0`, or `+W` offset for the whole current segment, preventing frame-to-frame wrap jitter |

The state/ref duplication is deliberate. Replacing the refs with ordinary state reads inside long-lived handlers or the rAF callback risks stale values, extra effect restarts, and visible camera jitter.

## File parsing pipeline

1. Picker and drag/drop both pass the first `File` to the same async loader.
2. `File.arrayBuffer()` keeps all file bytes in the browser. There is no `fetch`, form submit, storage, or network upload path.
3. CSV is detected by `.csv` suffix or `text/csv` MIME type.
4. CSV decoding order is important:
   - strict UTF-8 via `TextDecoder('utf-8', { fatal: true })`;
   - `TextDecoder('euc-kr')`, which covers the CP949-style Korean export used by the private local test file;
   - permissive UTF-8 as a last resort.
5. CSV text is passed to `XLSX.read(..., { type: 'string' })`; XLS/XLSX bytes use `{ type: 'array' }`.
6. Only the first worksheet is read. `sheet_to_json` uses `header: 1`, `raw: false`, and `defval: ''`.
7. The first 12 rows are searched for a row containing both “출발” and “도착”. Column mapping is substring-based, so order is flexible.
8. A valid sheet must expose departure and arrival airport columns. Optional fields include route type, countries, cities, departure date/time, airline, airline nationality, flight number, and aircraft type.
9. IATA extraction uppercases the cell and takes a standalone three-letter ASCII code, allowing labels such as `Airport Name (ICN)`.
10. Route type uses an explicit domestic/international cell when present, otherwise equal non-empty endpoint countries imply domestic and all other cases imply international.
11. Aircraft alternatives are normalized by retaining the first comma- or `or`-separated value.
12. Date parsing accepts a four-digit 19xx/20xx year, Korean month/day markers, or `YYYY.MM.DD`. It emits display text and a lexical `sortKey`; missing dates sort last.

Parser regressions to watch: losing CP949 fallback, scanning fewer header rows, making headers exact/case-sensitive, parsing only bare IATA cells, allowing worksheet cell objects to leak into strings, or changing same-country type inference.

## Filters and analytics

- Year values come from parsed non-null years and are sorted ascending.
- Filtering applies year and route type together. Any filtered-array change clears route selection and playback progress.
- Routes are grouped by an undirected sorted key, but the first observed direction supplies the rendered arc orientation and route metadata.
- Flight count includes every filtered row, even when coordinates are missing.
- Domestic/international count comes from the normalized type.
- Distance is a Haversine estimate using Earth radius 6,371 km and only rows whose two airports have registered coordinates. The displayed result is rounded once after summing.
- Earth-circumference equivalent divides the displayed distance by 40,075 km.
- Country count uses distinct non-empty endpoint country names. Country ranking counts each country at most once per flight.
- City and airport rankings count each departure and arrival occurrence. Airport labels retain the first non-empty city observed for the code.
- Airline ranking counts non-empty operating-airline strings.
- Unknown airport codes remain in counts/rankings but are omitted from map geometry, distance, and playback; the UI lists them explicitly.
- Ranking output sorts descending by count and displays the top 12.

During playback, live analytics rebuild the same maps/sets over `seq[0..idx]`. The current flight counts immediately for flight/type/country/city/airport/airline measures, while its distance is multiplied by current `t`. Ranking bars associated with the current flight are highlighted.

## Airport coordinate source

- `src/data/generated/ourAirports.ts` is a committed, deterministic compact snapshot generated from the public-domain OurAirports `airports.csv`. Only IATA code, latitude, and longitude enter the browser bundle.
- Normal upload, analytics, map, and playback code perform local object lookups only. They never send IATA values from a user's file to OurAirports or any other airport API.
- `npm run update-airports` downloads the fixed public dataset URL, validates its required schema, accepts only three-letter IATA codes with finite in-range coordinates, sorts output by IATA, and writes only when the coordinate content changes.
- Duplicate IATA rows with identical coordinates are equivalent. Otherwise, a unique scheduled-service/type priority may resolve the code and is reported. A tied geographic ambiguity stops generation until a reviewed upstream `ident` is added to `scripts/airport-duplicate-resolutions.mjs`.
- `src/data/airportOverrides.ts` is a deliberately small reviewed layer with precedence over generated data. REP is retained there for legitimate historical itineraries because the retired airport no longer has an IATA entry in the current upstream snapshot.
- A truly unresolved code retains the existing partial-results behavior: it remains in records and rankings but is excluded from geometry, distance, and playback.

## Map projection and route geometry

- The map uses a custom equirectangular-like SVG projection: width `W = 1000`, latitude range 76 to -58, and pixels per degree `W / 360`.
- `LAND` is simplified polygon/ring geometry converted once to SVG paths. It must retain `fillRule="evenodd"`, coastline stroke, and the current visual palette.
- `src/lib/landSeaTransfer.ts` applies those same ring semantics to disconnected transfers: even-odd parity within each top-level polygon, then a union of polygons. Exact coastline points count as land; wrapped query longitudes are normalized locally.
- Transfer sampling adapts to both angular span (about 0.25° per sample) and distance (about 20 km per sample), clamped to 16–1,024 intervals. Mode changes are refined with 12 bisection steps.
- Land/sea fragments shorter than 1.25% of a transfer are merged with adjacent modes. Under the 1.3–4.8 second shared duration envelope this suppresses roughly 16–60 ms visual noise from the deliberately simplified coastline.
- Directional route arcs are cached by `origin>destination`.
- Before projection, destination longitude is shifted by ±360 when needed so each route follows the shorter wrapped longitudinal span.
- Each route is a quadratic Bézier. The control point uses a perpendicular offset capped between 6 and 70 map units and bends generally poleward according to midpoint hemisphere.
- `quadPoint` and `quadAngle` drive aircraft position/orientation along the exact rendered curve.
- Route distance for statistics is Haversine, not Bézier length.
- The rendered SVG repeats the entire map group at `-W`, `0`, and `+W`. Camera longitude is intentionally not vertically-style clamped; repeated worlds provide wrap continuity.
- Route keys are undirected for selection/aggregation. The visible hit target is a transparent 16-unit non-scaling stroke so narrow routes remain clickable.
- Airport marker and label sizes are multiplied by inverse camera scale (`k`) so they remain legible. The top 12 airports are labeled at low zoom; all registered used airports are labeled at scale 3 or higher.

## Camera and pointer controls

- `cam.s` is clamped to 1–30. Vertical center is clamped so the viewport stays within the latitude extent. Horizontal center is normally modulo-wrapped for user controls.
- `viewBox` is derived from scale/center. `vx` is not clamped; `vy` is.
- Wheel zoom is cursor-centered and non-passive so browser scrolling can be prevented over the map.
- Zoom buttons are camera-centered; reset restores the full-world view.
- Pointer down does not use pointer capture. Instead, it installs window-level move/up/cancel listeners. This is a deliberate fix that allows route click propagation to continue working.
- A single pointer pans from the gesture-start camera. More than five total pixels of movement marks the gesture as moved and suppresses route/background clicks.
- Two pointers establish a pinch distance, midpoint, start camera, and map-space focus. Pinch updates both zoom and midpoint translation. Returning to one pointer establishes a fresh pan baseline.
- Any pointer/wheel interaction postpones automatic follow for 2,000 ms. The help copy now states the same two-second behavior.

Map regressions to watch: adding pointer capture, attaching passive wheel handlers, clamping longitude, omitting repeated world groups, normalizing follow-camera `cx` every frame, changing client-to-map math, or failing to suppress clicks after a drag.

## Playback state machine

### Sequence and timing

- Sequence contains only filtered flights with two known, distinct airports.
- It is sorted lexically by parsed `sortKey`, then by original row `id` for stable same-date ordering.
- Flights and disconnected transfers share `clamp(1000 + km / 3, 1300, 4800)` milliseconds before speed multiplication. Equal map-leg distances therefore receive equal symbolic animation time.
- Speed is applied to rAF delta time and cycles 1× → 2× → 4× → 1×.
- Play pauses without changing progress. Stop returns to inactive progress but preserves speed. Replaying a completed sequence starts from the beginning.

### Connected versus disconnected flights

- If the next departure airport equals the current arrival airport, playback advances immediately to the next curve.
- Otherwise, the current flight holds at `t = 1` while a transfer marker moves in a straight line from the arrival airport to the next departure airport.
- The transfer uses `wrapTowards` so the next airport is represented by the world copy nearest the prior arrival.
- The marker uses a bus silhouette over land and a ferry silhouette over sea. Both are side views that flip horizontally by travel direction, and no transfer path is left behind.
- This is a visualization convention, not transport history: mode is inferred along the straight airport-to-airport connection from the bundled simplified coastline. It does not claim the user literally travelled by bus or ferry or followed a real road/sea route.

### Automatic camera following and anti-jitter behavior

- New playback starts by snapping to the first departure with route-dependent scale.
- Flight camera target scale uses projected chord length and a softened denominator, then clamps and applies the current 1.3 multiplier. Short routes zoom closer; long routes stay wider.
- On each new flight/transfer segment, the nearest of `-W`, `0`, and `+W` is chosen relative to the current camera center. That offset remains fixed for the entire segment.
- A disconnected transfer uses the same projected-span camera-scale formula as a flight, computed once from the full straight connection. Short transfers zoom closer, long transfers stay wider, and coastline mode changes do not alter the target scale or tracking key.
- New segments snap position immediately. Transfer segments snap to their single route-derived scale; flight scale eases toward its route target.
- Continuing frames ease scale by 0.5 and position by 0.14. Tiny unchanged movements return the prior camera object.
- Active pointers and the follow-pause timestamp temporarily override auto-follow.

The fixed per-segment world offset is the core anti-jitter invariant. Re-evaluating the nearest world copy every frame, or modulo-normalizing auto-follow `cx`, can make the camera oscillate near the date line.

### Playback rendering

- Before playback, routes use domestic/international colors; selected routes are highlighted and unrelated routes fade.
- During playback, future routes are hidden, the current route is highlighted, and already encountered undirected route keys use the flown color.
- Aircraft categories are inferred from aircraft strings: widebody, classic narrowbody, neo/MAX narrowbody, rear-engine/T-tail regional, and wing-engine regional. Each category keeps its current SVG body/wing/tail/engine geometry and category scale.
- Plane scale is multiplied by inverse camera scale so the symbol remains screen-legible; position and rotation follow the Bézier.
- Current-flight overlay, live summary cards, and live ranking indicators update with playback.

## Route detail behavior

- Clicking a route toggles its undirected selection when playback is inactive and the pointer gesture did not move.
- Clicking the map background clears selection under the same conditions.
- The detail strip reports endpoints, grouped flight count, Haversine distance, and every grouped item sorted by display date.
- Each row retains date, direction, airline fallback, flight number, aircraft type, and domestic/international accent color.

## Migration boundaries and regression strategy

Safe initial extractions:

- Type definitions.
- Airport coordinate and land geometry constants.
- Pure parser/date helpers.
- Pure projection/geometry helpers, provided the single directional arc cache and wrap behavior remain unchanged.
- A small clearly synthetic sample fixture, if used.

Intentionally retained as one larger component for this phase:

- React state/ref orchestration.
- Pointer and wheel controls.
- Playback rAF state machine.
- Camera-follow logic.
- Map/dashboard rendering and route details.

Validation priorities:

1. TypeScript strict validation, lint, and production build.
2. Parser-focused tests covering UTF-8, Korean CP949 fallback, header offsets/order, IATA-in-label cells, inferred route types, unknown airports, and date normalization.
3. Pure geometry/analytics tests for wrap, short dateline arcs, distances, grouping, and chronological ordering.
4. Browser smoke load with no console/runtime errors and confirmation that `dist` contains no private CSV data.
5. Manual browser verification for picker, drag/drop, XLS/XLSX/CSV variants, route click/detail, pan, wheel, pinch, world wrap, playback controls, live stats, disconnected bus transfer, camera override/reacquire, and anti-jitter behavior. Automated checks must not be claimed for interactions they do not exercise.

## Known pre-migration risks

- Node/npm is not currently available on `PATH`; a compatible local Node runtime must be provisioned before dependency installation and validation.
- Vite can serve files from its project root during development even when Git ignores them. The configuration should explicitly deny private flight filenames and remain localhost-only.
- `xlsx` is expected to make the bundle comparatively large; a chunk-size warning is not itself a behavior failure and should not trigger an unrelated lazy-loading refactor in this phase.
- The source has no existing automated tests. Visual, gesture, and playback parity therefore still needs explicit browser verification after the build is available.
