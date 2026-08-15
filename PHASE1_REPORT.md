# Flight Log Phase 1 report

## Outcome

The existing Flight Log is now a local npm project using React 18, Vite 6, and strict TypeScript. The production build succeeds. CSV, XLS, and XLSX input remains an in-browser workflow: the selected file is read with `File.arrayBuffer()` and parsed locally, with no upload or application network transport.

This phase did not redesign the interface, add deployment configuration, or introduce a backend, authentication, a database, or a replacement data workflow.

## Resulting project structure

```text
.
├── .gitignore
├── MIGRATION_NOTES.md
├── PHASE1_REPORT.md
├── eslint.config.js
├── flight-log-chart.html       # unchanged, local-only reference
├── flight-log-chart.jsx        # unchanged, local-only reference
├── flights.csv                 # private local input; ignored and never bundled
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── src
    ├── main.tsx
    ├── index.css
    ├── types.ts
    ├── components
    │   └── FlightLogChart.tsx
    ├── data
    │   ├── airports.ts
    │   ├── landGeometry.ts
    │   └── syntheticFlights.ts
    └── lib
        └── parser.ts
```

Generated `node_modules/`, `dist/`, and the local portable toolchain under `.tools/` are ignored and omitted above. There is no `public/` directory, and Vite's `publicDir` passthrough is disabled.

## What was migrated

- The standalone React component was converted to a typed React component and mounted through `src/main.tsx`.
- React state, mutable refs, derived analytics, SVG map rendering, pointer gestures, playback rAF loop, camera following, and route detail rendering were retained.
- Airport coordinates and land geometry moved into typed data modules. Mechanical comparison found the airport table and land geometry unchanged from the reference literals.
- The file parser moved into `src/lib/parser.ts`. It retains CSV/XLS/XLSX handling, UTF-8 to EUC-KR fallback, flexible Korean header matching, first-12-row header discovery, and IATA extraction from labeled cells.
- Shared flight and parser types moved into `src/types.ts`.
- The optional sample action now uses four clearly fictional flights dated 2099. The detailed 68-row history in the local references was not copied into `src` or the bundle.
- Existing CSS and aircraft silhouette geometry were retained mechanically. The visual design was not revised.
- The local references remain unchanged. Their SHA-256 values after migration are:
  - `flight-log-chart.jsx`: `396624CEA46B73A4A07E9959FB0CDD44A58276EE748CC96C3BCD974D7CEF4AE2`
  - `flight-log-chart.html`: `F7071F3389C82E33D20F9E2DB6F7071D9C56898B93CE18591B1765132D746C4D`

## Intentionally retained structure

`FlightLogChart.tsx` remains a comparatively large, cohesive component. Camera refs, pointer gesture state, playback state, the animation loop, follow override, fixed world-copy offset, live analytics, and SVG rendering are closely coupled and timing-sensitive. Splitting those systems further during a parity migration would have increased regression risk.

The Vite entry point, types, parser, and obvious static data were extracted. The map/playback orchestration and current inline styling remain together for this phase.

The standalone HTML's CDN/Babel dependency boot screen was not carried into the Vite application because npm packages are compiled into the Vite bundle. This does not alter the Flight Log workflow after the app loads.

## Privacy controls

- `/flights.csv`, `/flights.xls`, and `/flights.xlsx` are in `.gitignore`.
- The two legacy references are also ignored because they contain local history and must remain reference-only.
- No private flight file exists under `src/`, `dist/`, or a `public/` directory.
- `publicDir: false` prevents Vite from blindly copying future root `public/` assets.
- The Vite development and preview servers bind to `127.0.0.1` by default.
- Vite request, import, and filesystem guards reject the private flight filenames, all XLS/XLSX files, and the two local reference files.
- Direct checks against development and preview returned HTTP 404 for `/flights.csv`, `/flight-log-chart.jsx`, and `/flight-log-chart.html`.
- Source scans found no `fetch`, XMLHttpRequest, FormData, beacon, WebSocket, or EventSource path. Browser checks observed zero requests after each tested file selection/drop.
- The real local CSV was used only for local parser validation. Its rows were not copied into application source, generated samples, documentation, or `dist`.

The workspace was not a Git repository when this work began, so tracked-file status could not be verified with `git status`. The ignore and serving controls are present for a future repository.

## Feature parity checklist

### File handling

| Feature | Migration status | Validation performed |
| --- | --- | --- |
| CSV | Preserved | UTF-8 synthetic CSV and the local Korean/CP949 CSV both loaded in headless Chrome |
| XLS and XLSX | Preserved | Generated synthetic `.xls` and `.xlsx` files both loaded |
| Drag and drop | Preserved | Browser `DragEvent`/`DataTransfer` flow exercised with a synthetic CSV |
| File picker | Preserved | File-input selection exercised through browser automation; native OS picker UI not manually exercised |
| UTF-8/Korean fallback | Preserved | UTF-8 fixture and real local non-UTF-8 CSV accepted |
| Flexible headers and IATA labels | Preserved | Reordered columns, a header on row 2, and airport labels containing IATA codes were exercised |
| Browser-local processing | Preserved | Zero post-selection/drop requests observed for CSV, XLS, and XLSX cases |

### Filters and statistics

| Feature | Migration status | Validation performed |
| --- | --- | --- |
| Year, domestic, international filters | Preserved | Filter controls exercised and expected synthetic route counts observed |
| Flight/domestic/international counts | Preserved | Four-flight fixture reported 4 total, 2 domestic, and 2 international |
| Distance and Earth equivalent | Preserved | Synthetic total reported 3,349 km and 0.1 Earth circumference |
| Country and airport counts | Preserved | Synthetic counts reported 2 countries and 4 airports |
| Country/city/airport/airline rankings | Preserved | All four tabs opened and rendered |

### Map

| Feature | Migration status | Validation performed |
| --- | --- | --- |
| Custom SVG land geometry and visual language | Preserved | Geometry and CSS literals mechanically matched; rendered screenshot inspected |
| Routes, markers, and labels | Preserved | Dashboard rendered route hit targets and airport presentation |
| Route click and detail | Preserved | A route was selected and its detail strip opened |
| Pan, wheel zoom, pinch zoom | Preserved | ViewBox changes exercised for all three browser event paths |
| Longitude wrap and reset controls | Preserved | Dateline fixture and reset/zoom controls exercised |

### Playback

| Feature | Migration status | Validation performed |
| --- | --- | --- |
| Chronological sorting | Preserved | Out-of-order synthetic input played the earliest flight first |
| Animated aircraft and silhouette categories | Preserved | Rendering literals mechanically matched and representative playback rendered; every category still needs a visual browser pass |
| Play/pause and stop/reset | Preserved | Controls exercised during flight and ground transfer |
| 1x/2x/4x speed | Preserved | 1x to 2x transition exercised; full cycle remains a manual check |
| Route-dependent camera zoom | Preserved | Short route used 14.1x and long route used 4.4x in the test fixture |
| Automatic follow and manual override | Preserved | Manual wheel zoom held during override and automatic follow reacquired afterward |
| Already-flown routes and live statistics | Preserved | Flown path copies and live summary/rank UI observed during playback |
| Disconnected-flight bus transfer | Preserved | Transfer, bus copies, pause behavior, and 18x ground camera observed |
| Anti-jitter world-wrap behavior | Preserved | Dateline playback remained continuous; largest sampled horizontal step was about 74 map units rather than a world-width jump |

## Dependency note

The references used `xlsx` 0.18.5. That npm-registry release produced a direct high-severity audit finding with no registry fix. The migration intentionally uses SheetJS's official 0.20.3 tarball, which is the current distribution documented by SheetJS. The parser APIs used by this application compile and the CSV/XLS/XLSX browser checks pass after the change. `npm audit` reports zero vulnerabilities.

This is a deliberate security dependency delta, not a parser redesign. SheetJS 0.20.x changed some date-object/formatted-date UTC behavior, so true Excel date cells near timezone or calendar-day boundaries remain a focused manual parity risk. A fresh install also needs access to `cdn.sheetjs.com`; the lockfile records package integrity.

## Commands executed and results

The machine did not have Node/npm on `PATH`, so Node 22.22.0 was provisioned under ignored `.tools/` for validation. The official archive checksum was checked before use. The project commands themselves are standard npm commands and do not depend on that local path once Node is installed normally.

```text
npm install
npm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
npm ls --depth=0
npm audit --audit-level=high --cache .tools/npm-cache
npm run typecheck
npm run lint
npm run build
npm run dev -- --host 127.0.0.1 --port 4174 --strictPort
node .tools/browser-smoke.mjs
```

Results:

- TypeScript (`tsc -b --pretty false`): passed with no errors.
- ESLint (`eslint .`): passed with no errors or warnings.
- Production build (`tsc -b && vite build`): passed; 32 modules transformed.
- Output: `index.html` 0.54 kB, CSS 0.07 kB, JavaScript 560.47 kB (189.24 kB gzip).
- Vite emitted its non-failing warning for a minified chunk larger than 500 kB. SheetJS is the main contributor.
- npm security audit: zero vulnerabilities.
- `npm run dev`: served the app on loopback; app root returned 200 and guarded local-only paths returned 404.
- Headless Chrome smoke run: passed with zero runtime exceptions and zero console errors.
- Browser file checks: real local CSV plus synthetic UTF-8 CSV, XLS, and XLSX all produced a dashboard, statistics, and routes without application errors or post-input network requests.

No committed unit-test or end-to-end-test suite was added in this phase. The browser smoke harness and generated workbooks are local ignored validation artifacts rather than product code.

## Known risks and remaining manual browser verification

- Use the native OS file-picker dialog and physical drag-and-drop with representative personal CSV/XLS/XLSX exports.
- Compare true Excel date/time cells around timezone and day boundaries because of the intentional SheetJS version delta.
- Exercise a real touch device for pinch/pan transitions and a physical mouse/trackpad for wheel behavior.
- Watch a long real-data playback through multiple world wraps, connected flights, and disconnected transfers for visual smoothness and label overlap.
- Visually inspect every aircraft silhouette category and complete the 1x → 2x → 4x → 1x speed cycle.
- Check responsive behavior and interaction in additional target browsers. The automated pass used Chrome on the local desktop.
- The existing UI says camera follow resumes after three seconds, while the reference logic actually uses two seconds. The migration preserves the two-second behavior; correcting the copy or timing belongs to a later phase.
- The main JavaScript chunk exceeds Vite's default warning threshold. Code splitting was intentionally deferred to avoid unrelated loading/parser changes during parity migration.
- Fresh dependency installation currently requires the official SheetJS CDN tarball to be reachable. Vendoring it was not introduced in this phase.

No visual redesign, GitHub Pages preparation, backend, authentication, database, or CSV-workflow replacement was performed.
