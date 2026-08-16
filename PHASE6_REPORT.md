# Flight Log Phase 6 Report

Date: 2026-08-16

## Summary

Phase 6 fixes the landing-title line break and replaces the former 172-entry
hand-maintained coordinate table with a comprehensive, generated local airport
index. The existing CSV/XLS/XLSX workflow, custom SVG map, analytics, timeline,
route detail, world wrap, and ref/rAF playback architecture were not rewritten.

## Landing title fix

The landing `<h1>` now contains two explicit block-level title spans:

```text
비행 기록
차트
```

The first line uses `white-space: nowrap` inside the existing responsive type
scale, so browser word wrapping can no longer split `기록`. The heading remains
one semantic `<h1>` and its accessible text remains `비행 기록 차트`.

Production screenshots and layout measurements were checked at 360×780,
390×844, 768×1024, 1366×850, and 1920×1080. At every checkpoint the two labels
occupied separate lines, the first line fit its viewport, and document
`scrollWidth` equaled `clientWidth`.

## Previous airport limitation

The release candidate used a manually maintained table of 172 IATA coordinate
entries. An otherwise valid IATA code outside that table remained available in
the archive and rankings but could not contribute map geometry, Haversine
distance, or playback.

## New airport architecture

```text
OurAirports airports.csv
→ deterministic Node update script
→ validated IATA/latitude/longitude records only
→ committed compact TypeScript index
→ reviewed manual override
→ local application lookup
→ unknown fallback
```

- Upstream: [OurAirports open data](https://ourairports.com/data/) and its
  documented [`airports.csv` fields](https://ourairports.com/help/data-dictionary.html).
  OurAirports releases the dataset to the public domain without an accuracy or
  fitness guarantee.
- `scripts/update-airports.mjs` downloads one fixed public URL. It does not
  receive or inspect a user's flight file or IATA list.
- The updater validates the expected upstream columns, accepts only three-letter
  IATA records, requires finite latitude/longitude within geographic ranges,
  rounds coordinates to six decimal places, sorts by IATA, validates the final
  index, and writes deterministic output only when content differs.
- Duplicate IATA rows are detected before output. Equivalent coordinates are
  reported; otherwise a unique scheduled-service/type priority can be selected
  and reported. A tied geographic ambiguity fails generation until a reviewed
  OurAirports `ident` is added to
  `scripts/airport-duplicate-resolutions.mjs`. The current snapshot contained
  no duplicate IATA codes.
- `src/data/generated/ourAirports.ts` is committed so normal installation,
  builds, and GitHub Pages deployment do not need live access to OurAirports.
- `src/data/airportOverrides.ts` is a small precedence layer. Its single current
  entry retains `REP` for historical itineraries: the former airport was in the
  validated table but no longer has an IATA entry in the current upstream
  snapshot after service moved to `SAI`.
- A truly unknown code still follows the established partial-results behavior:
  records and rankings remain available while geometry, distance, and playback
  skip the unresolved segment.

Normal browser use imports the committed index and performs local object
lookups. There is no runtime airport API, backend, account, or database.

## Generated data and bundle impact

The snapshot generated during this phase reported:

```text
upstream CSV                 12,700,423 bytes / 85,912 rows
generated IATA airports      9,052
generated TypeScript index   297,189 bytes
duplicate IATA codes         0
```

Only IATA code, latitude, and longitude are shipped. Airport name,
municipality, country, links, runway data, and other unrelated metadata are not
embedded.

Production bundle comparison:

```text
                              before Phase 6       Phase 6          change
application JavaScript        197.25 kB / 66.72 gz 427.40 / 176.44  +230.15 / +109.72
spreadsheet parser            369.20 kB /125.19 gz 369.20 / 125.19  unchanged
CSS                            21.47 kB /  4.54 gz  21.56 /   4.56  +0.09 / +0.02
```

The application chunk remains below Vite's 500 kB warning threshold. The
upstream CSV itself is not present in `src` or `dist`.

## Update procedure

Manual refresh:

```bash
npm run update-airports
npm run lint
npm run test
npm run typecheck
npm run build
```

Running the updater twice against the same upstream snapshot produced the same
coordinate SHA-256 and the second run reported `Airport index unchanged`.

`.github/workflows/update-airports.yml` is scheduled for 04:17 UTC on the first
day of every month and also supports manual dispatch. It installs with
`npm ci`, regenerates, runs lint/tests/typecheck/build, and does nothing when the
coordinate module is unchanged. If it changed, the workflow uses only
`contents: write` and `pull-requests: write` to update an automation branch and
open a reviewable pull request. It does not commit directly to `main`; merging
the PR triggers the existing Pages deployment workflow.

GitHub's repository setting **Settings → Actions → General → Allow GitHub
Actions to create and approve pull requests** must permit PR creation. If that
setting remains disabled, the manual command remains available. Change the
monthly timing by editing the workflow's `cron`; disable it from the Actions
page or remove the `schedule` block. The workflow YAML was parsed locally, but
the scheduled GitHub-hosted run itself was not executed in this workspace.

## Tests

Twelve tests were added, bringing the current total to 61 tests in 8 files.

- Generated index size and representative legacy-code lookup.
- A representative newly covered code (`BLL`) absent from the old table.
- Missing IATA, invalid IATA, and invalid coordinate filtering.
- Expected-column/schema validation.
- Duplicate reporting and deterministic priority resolution.
- Failure for unresolved ambiguous duplicates.
- Explicit reviewed duplicate selection.
- Generated ordering and coordinate-range validation.
- Manual override precedence and the reviewed historical override.
- Unknown-IATA fallback.

All fixtures are synthetic. No personal flight row was added to source, tests,
generated data, or documentation.

## Automated validation

Final commands run against the Phase 6 working tree:

```text
npm run lint       PASS
npm run test       PASS — 61 tests, 8 test files
npm run typecheck  PASS
npm run build      PASS — 50 modules transformed
```

The production build contained `index.html`, one CSS asset, the application
chunk, and the unchanged spreadsheet-parser chunk. No >500 kB Vite warning was
emitted.

## Browser QA

All browser checks used the production preview in Chrome 151.

Focused Phase 6 QA:

- Five landing checkpoints listed above passed exact line-content, line-order,
  fit, and horizontal-overflow assertions; their screenshots were visually
  inspected.
- A two-flight fictional 2099 CSV was dropped into the page using `ICN ↔ BLL`.
  `BLL` is present in the generated index and was confirmed absent from the
  former manual table.
- The BLL marker and route rendered, route detail opened, two timeline entries
  appeared, total distance was 16,161 km, and playback rendered the aircraft on
  the BLL route.
- Focused QA observed zero runtime exceptions, zero console errors, and zero
  requests after the synthetic file-drop mark.

Broad regression rerun:

- Landing, built-in synthetic sample, statistics, all ranking tabs, route click
  and keyboard selection.
- Pan, zoom buttons, wheel zoom, synthetic two-pointer pinch path, and reset.
- Playback start/pause/stop, 1×→2×→4×→1×, route-dependent zoom, live stats,
  ground-transfer bus, flown routes, manual camera override/reacquisition, and
  dateline wrap continuity.
- Local CP949-style real CSV through the file-input path without recording any
  personal values in output.
- Synthetic UTF-8 CSV through drag/drop, plus synthetic XLS and XLSX through
  the file-input path.
- Unsupported file, missing header, missing valid IATA, broken workbook,
  partial unknown-coordinate results, and empty-filter states.
- Loaded sample layouts at 360, 390, 768, 1366, and 1920 px with no horizontal
  overflow, 44 px minimum visible button height, map/timeline presence, and no
  console/runtime errors.

## Privacy and network QA

- `src` contains no runtime `fetch`, XHR, beacon, WebSocket, or airport API
  client. The only OurAirports network call is the fixed-URL Node maintenance
  script and monthly workflow.
- After the upload mark, the real local CSV, synthetic CSV, XLS, XLSX, error
  fixtures, and new BLL fixture each produced zero application network
  requests in the tested production-preview sessions.
- The generated module contains only public airport codes and coordinates. The
  raw upstream CSV is neither committed nor bundled.
- Ignore checks and a dry-run public candidate audit continued to exclude the
  private root flight file, private root workbooks, legacy reference files,
  `.tools`, `node_modules`, and `dist`.
- No remote push, deployment, or publication was performed during Phase 6. An
  existing `origin` remote was observed and left untouched.

## Remaining limitations

- OurAirports is community-maintained and explicitly provides no accuracy
  guarantee. A retired, reused, or newly assigned IATA code can require review.
- The current override audit compared all 172 former entries: 171 resolved from
  the snapshot and one historical code required retention. Future snapshot
  changes can create new historical exceptions.
- Automatic PR creation depends on the repository's GitHub Actions permission
  setting and still requires a human merge before Pages deployment.
- A physical touch device, native Windows/macOS picker UI, every browser/GPU,
  and very long real-history playback were not exhaustively tested.
- SheetJS date/timezone boundary behavior for native Excel date cells remains
  the previously documented manual risk and is unrelated to airport lookup.
