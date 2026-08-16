# Personal Flight Log

개인 CSV·Excel 비행 기록을 지도와 시간 속에서 다시 보는 개인용 비행 아카이브입니다.

로컬 파일을 열면 평생 비행 통계, 사용자 정의 SVG 세계 지도, 노선 상세, 시간순 여정 재생, 연도별 비행 타임라인, 국가·도시·공항·항공사 순위를 한 페이지에 만듭니다. 로컬 파일이 기록의 원본이며, 이 프로젝트는 비행 기록을 편집하거나 클라우드에 저장하는 서비스가 아닙니다.

## Features

- CSV, XLS, XLSX 파일 선택과 드래그 앤 드롭
- UTF-8 CSV와 한국어 CP949 계열 CSV 디코딩 폴백
- 유연한 한국어 헤더 탐색과 괄호 안 IATA 코드 인식
- 연도, 국내선, 국제선 필터
- 비행 편수, 거리, 지구 둘레 환산, 국가·공항 수
- 국가·도시·공항·운항사 순위
- 사용자 정의 SVG 세계 지도, 반복 세계 경도 래핑, 노선과 공항 표시
- 노선 선택/상세, 팬, 휠 확대, 핀치 확대, 카메라 초기화
- 기종별 항공기 실루엣과 시간순 `PLAY MY JOURNEY`
- 자동 카메라 추적, 수동 조작 우선, 연결되지 않은 여정의 지상·해상 이동 표현
- 필터와 연동되는 연도별 Flight Timeline
- 데스크톱, 태블릿, 360/390 px 화면 대응

## How it works

```text
local CSV / XLS / XLSX
→ browser parsing
→ map / statistics / timeline / journey replay
```

파일 선택은 브라우저의 `File` API를 사용하고, SheetJS가 같은 브라우저 안에서 워크북을 읽습니다. 애플리케이션에는 비행 파일을 받는 업로드 API가 없습니다.

연결되지 않은 두 비행 사이의 이동은 공항 사이 직선과 번들에 포함된 단순화된 해안선을 기준으로 버스(지상) 또는 페리(해상) 아이콘으로 표현합니다. 이는 여정의 흐름을 보여주는 시각적 관례이며 실제 교통수단이나 실제 이동 경로를 뜻하지 않습니다. 판정 과정은 브라우저 안의 로컬 지도 데이터만 사용합니다.

## Privacy

- 선택한 파일은 현재 브라우저 안에서 처리됩니다.
- 애플리케이션 업로드 엔드포인트, 계정, 인증, 백엔드, 데이터베이스가 없습니다.
- 개인 비행 기록은 `src`나 공개 빌드에 포함되지 않습니다.
- Git은 루트의 CSV/XLS/XLSX 파일과 로컬 레퍼런스 파일을 무시하며, Vite도 개발/미리보기에서 이런 파일의 직접 제공을 막습니다.
- 자동 브라우저 검증에서는 파일 선택 뒤 애플리케이션 네트워크 요청이 관찰되지 않았습니다. 이는 수행한 테스트의 관찰 결과이며 모든 실행 환경에 대한 절대적인 보안 보장은 아닙니다.

개인 비행 파일은 항상 자신의 기기에만 두고 Git에 추가하지 마세요.

## Supported formats

- CSV (`.csv`)
- Excel 97–2003 (`.xls`)
- Excel Workbook (`.xlsx`)

CSV는 엄격한 UTF-8 디코딩을 먼저 시도한 뒤 한국어 CP949/EUC-KR 계열 디코더를 사용합니다. XLS/XLSX는 첫 번째 워크시트를 읽습니다. SheetJS는 공식 CDN tarball로 잠겨 있으므로 새 의존성 설치에는 해당 배포 서버에 접근할 수 있어야 합니다.

## Local development

Node.js 22 이상을 권장합니다.

```bash
npm install
npm run dev
```

개발 서버는 안전을 위해 기본적으로 `127.0.0.1`에만 바인딩됩니다.

## Validation

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

프로덕션 빌드를 로컬에서 확인하려면 다음을 실행합니다.

```bash
npm run preview
```

## Data format

헤더는 첫 12행 안에 있어야 하며, `출발 공항`과 `도착 공항` 열은 필수입니다. 다음 열을 인식합니다.

| 구분 | 지원 열 |
| --- | --- |
| 필수 | 출발 공항, 도착 공항 |
| 날짜/유형 | 출발 시각 또는 출발 날짜, 국제선/국내선 |
| 장소 | 출발/도착 국가, 출발/도착 도시 |
| 운항 | 항공사, 항공사 국적, 편명, 비행기 기종 |

공항 셀은 `ICN`처럼 코드만 쓰거나 `예시 공항 (ICN)`처럼 표시할 수 있습니다. 열 순서는 자유롭습니다. 노선 유형이 비어 있으면 두 국가가 모두 같을 때만 국내선으로 추론합니다.

아래 행은 형식 설명을 위한 **2099년의 명시적 합성 예시**이며 실제 여행 기록이 아닙니다.

| 국제선/국내선 | 출발 국가 | 출발 도시 | 출발 공항 | 도착 국가 | 도착 도시 | 도착 공항 | 출발 시각 | 항공사 | 편명 | 비행기 기종 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 국제선 | 예시국 A | 가상 서울 | ICN | 예시국 B | 가상 도쿄 | NRT | 2099.01.01 | 샘플 인터내셔널 (가상) | SI 201 | B787-9 |

좌표가 등록되지 않은 IATA 코드는 기록, 편수, 공항/도시/국가 순위에는 남지만 지도, 거리 계산, 여정 재생에서는 제외됩니다.

## Airport coordinate data

Airport coordinates are looked up locally from a compact generated snapshot of
the [OurAirports public-domain airport data](https://ourairports.com/data/).
The public application retains only IATA code, latitude, and longitude; it does
not query an airport API with codes from an uploaded flight file.

To refresh the committed snapshot manually:

```bash
npm run update-airports
npm run lint
npm run test
npm run typecheck
npm run build
```

The updater validates the upstream columns and coordinate ranges, filters to
three-letter IATA records, and reports duplicate-code decisions. A genuinely
ambiguous duplicate fails until its OurAirports `ident` is reviewed and added
to `scripts/airport-duplicate-resolutions.mjs`. The small manual override layer
in `src/data/airportOverrides.ts` takes precedence over generated data; it is
reserved for reviewed historical or corrected coordinates.

`.github/workflows/update-airports.yml` runs at 04:17 UTC on the first day of
each month. It does nothing when coordinates are unchanged. When they change,
it updates an automation branch and opens a pull request rather than writing
directly to `main`; merging that reviewed PR triggers the normal Pages workflow.
The schedule can be changed by editing its `cron` expression, or disabled from
the repository's Actions page (or by removing the `schedule` block). Repository
settings must allow GitHub Actions to create pull requests for the automatic PR
step; manual updates remain available otherwise.

## GitHub Pages

`.github/workflows/deploy.yml`은 `main` 푸시마다 다음 순서로 실행되도록 준비되어 있습니다.

```text
npm ci
→ lint
→ test
→ typecheck
→ production build
→ upload dist only
→ GitHub Pages deploy
```

Vite는 GitHub Actions의 `GITHUB_REPOSITORY`에서 저장소 이름을 읽습니다. 일반 프로젝트 저장소는 자동으로 `/<repository>/`를 사용하고, `<username>.github.io` 저장소는 `/`를 사용합니다. 로컬 개발과 일반 로컬 빌드는 계속 `/`에서 동작하므로 사용자 이름을 설정 파일에 넣을 필요가 없습니다.

실제 배포 전 GitHub 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택하세요. 이 작업 공간을 준비한 과정에서는 원격 저장소 생성, GitHub 인증, 푸시 또는 외부 게시를 수행하지 않았습니다.

## Project notes

- [MIGRATION_NOTES.md](MIGRATION_NOTES.md) — parser, geometry, camera, playback invariants
- [PHASE3_REPORT.md](PHASE3_REPORT.md) — product redesign and responsive/browser validation
- `FINAL_REPORT.md` — release-candidate validation and remaining owner steps
