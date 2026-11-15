# FIELDWISE

**Your land, understood. · أرضك، نفهمها معاً.**

A farmer-first, Arabic-default agricultural decision-support **frontend** for an independent NASA Space Apps 2026 project concept. No NASA endorsement is implied.

## Frontend-only boundary

There is **no backend, database, API route, serverless function, server action, AI integration, secret, or API key**. Production output is static HTML, JavaScript, CSS, fonts, and imagery.

- Components use hooks; hooks use the single `api` object in `src/lib/api/client.ts`.
- `mock.ts` is the default client, with realistic delays and explicitly simulated values.
- `http.ts` is the only application fetch implementation. It calls your separately hosted backend.
- All mock responses carry `simulated: true`. Demo notices and resolution labels prevent presenting simulated values as measurements.
- `insufficient_data` is a separate response type. Read and save paths list the exact missing fields and link to their forms, without displaying a recommendation.
- Local storage holds drafts, language, selected strategy, demo API state, and checklist completion. Mock and HTTP drafts use different storage keys.

**Backend handoff:** `docs/API_CONTRACT.md`. **Authoritative types:** `src/lib/api/types.ts`.

## Run locally

Use Node.js 22 or newer and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run dev
```

No `.env` is required for the simulated demo. Arabic/RTL is the default; the header toggle switches to English and remembers the choice on this device.

```sh
npm run build        # TypeScript check + static production output in dist/
npm run preview      # Inspect the production build locally
npm test             # Vitest + React Testing Library
npm run test:watch   # Interactive unit-test runner
```

## Exactly how to switch to your real API

1. Copy `.env.example` to a local `.env` file.
2. Set:

   ```dotenv
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=https://your-backend.example/v1
   ```

3. Implement the methods, paths, and JSON envelopes in `docs/API_CONTRACT.md`.
4. Enable CORS for your frontend origin. Requests send `Accept-Language: ar|en` and JSON when a body is present.
5. Restart the development process, or run `npm run build` again for production. Vite variables are embedded at build time.

Only the exact string `false` enables HTTP. A missing base URL in HTTP mode produces a retryable error; it **never silently falls back to mock results**. Requests time out after 20 seconds. Add authentication or your own headers centrally in `http.ts`. Never put secrets in `VITE_*` variables; they are public browser configuration.

Successful responses use `{ status: 'ok', simulated: false, data: ... }`. Missing input uses `{ status: 'insufficient_data', simulated: false, missing_inputs: [...] }`, with HTTP 200 or 422. Other failures use non-2xx responses.

**Scoring boundary:** `src/lib/scoring.ts` is demonstration-only. For non-simulated comparison data, the UI displays the backend `totalScore` and disables demo reweighting. Extend the comparison endpoint when you add authoritative live scoring. Reordering a mock rotation does not invent new agronomic evidence.

## Pages

| Route              | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `/`                | Welcome, three-step explanation, estimate disclaimer            |
| `/start`           | Farm name, resume/new setup, demo entry                         |
| `/farm/location`   | Search stub, map pin, optional geolocation, manual coordinates  |
| `/farm/boundary`   | Draw/edit/delete, hectare/dunam area, coordinate editor         |
| `/farm/profile`    | Soil cards, optional lab values, irrigation, resources          |
| `/farm/history`    | Crops, seasons, planting/harvest months, order, field shares    |
| `/farm/priorities` | Six weights, presets, per-criterion unknown paths               |
| `/farm/analysis`   | Dataset run states, indicators, charts, confidence, provenance  |
| `/farm/planner`    | Three rotations, drag reorder and keyboard alternatives         |
| `/farm/compare`    | Demo weights, three strategies, radar, evidence drawers         |
| `/farm/explore`    | Above-ground 3D terrain, overlays, date split, view controls    |
| `/farm/plan`       | Monthly checklist, local completion, all-month print layout     |
| `/methodology`     | API-loaded datasets, sources, limits, formula integration notes |

Unknown routes receive a friendly not-found screen. `vercel.json` supports direct navigation to client-side pages.

## Folder map

```text
src/
  App.tsx                 Lazy-loaded routes and providers
  index.css               Tailwind @theme: palette, fonts, spacing, shapes
  components/
    Layout.tsx            Navigation, language, persistent disclaimer
    Stepper.tsx           Accessible setup progress
    WizardPage.tsx        Shared setup frame and draft footer
    MapPicker.tsx         MapLibre map and draggable pin
    PolygonEditor.tsx    Terra Draw and keyboard coordinate editor
    UnknownOption.tsx    Reusable honest-unknown answer
    DatasetCard.tsx      Dataset run states and source scales
    IndicatorCard.tsx    Estimates, sparklines, confidence, data gaps
    ResolutionBadge.tsx  Source resolution, not field accuracy
    SourcePopover.tsx    Accessible provenance dialog
    WeightSlider.tsx     Reusable 1–5 control
    StrategyCard.tsx     Criterion scores and evidence actions
    EvidenceDrawer.tsx   Evidence, assumptions, gaps, risks
    RotationTimeline.tsx Drag and keyboard crop ordering
    TerrainViewer.tsx    React Three Fiber + drei surface viewer
    LayerToggle.tsx      Explicit illustrative/estimate labels
    SimulatedBanner.tsx  Visible simulated-data notice
    AsyncState.tsx       Loading, empty, error, missing-input states
  pages/                  One page per route
  hooks/                  API resources, farm draft, polling, local UI state
  lib/
    api/
      types.ts            All request and response interfaces
      client.ts           Single swappable api object
      mock.ts             Delayed client and isolated mock persistence
      http.ts             Central fetch client
    i18n.ts               Arabic-first language and document direction
    schemas.ts            Shared Zod form schemas
    geometry.ts           Turf area and polygon validation
    scoring.ts            Pure, replaceable demo weighted mean
    rotation.ts           Immutable reorder helpers
    terrain.ts            Grid validation, mesh, polygon draping
  locales/ar.json         Arabic UI and simulated-content translations
  locales/en.json         Matching English translations
  mocks/                  Jenin demo, 12 crops, 7 datasets, time series,
                          height grid, scenarios, action plan, methodology
  styles/                 Feature styles, print layout, accessibility
  test/                   Vitest and React Testing Library tests
public/
  favicon.svg             FIELDWISE sprout icon
  fonts/                  Locally served fonts and OFL licenses
  images/hero-fields.webp Replaceable illustrative welcome image
docs/API_CONTRACT.md       Backend handoff contract
e2e/journey.spec.ts        Main journey across viewport projects
scripts/serve-build.mjs    Test-only static host, no application API
```

## Maps, terrain, and assets

- **2D:** MapLibre GL with Terra Draw. Public CARTO/OpenStreetMap raster tiles require no keys. These are display assets, not farm-analysis API calls. Keep the visible attribution. Change the tile source in `MapPicker.tsx` to use a different licensed basemap.
- **Drawing:** click each corner, then the first point to close. Select and drag vertices to edit. Clear removes the boundary. Keyboard users can enter one `longitude, latitude` pair per line, repeating the first pair at the end. Turf validates closure, self-intersections, coordinate ranges, and a 100 m² minimum. One hectare = 10,000 m²; one dunam = 1,000 m². This is not a land survey.
- **Location search:** the demo recognizes Jenin/جنين and Burqin/برقين; results are labeled simulated. The real client calls your `/places` endpoint. Geolocation permission is optional and can be denied without blocking setup.
- **3D:** one surface built from `getLayer('terrain')`, with a draped farm polygon. Other API grids drive colors. The comparison slider separates `grid` and `comparisonGrid`; vertical exaggeration is visual only. There are **no underground soil layers or geological cross-sections**. Orbit stays above the terrain. Buttons provide keyboard-accessible orbit, zoom, and reset; unavailable WebGL has a readable fallback.
- **Mock gaps:** Landsat is deliberately partial with null samples. ECOSTRESS is unavailable with null values. The dashboard can show an insufficient-data example without replacing the current farm draft.
- **Imagery:** `hero-fields.webp` is an AI-generated, replaceable illustration of a Mediterranean agricultural landscape, not a photo or satellite image of the demo farm. The UI discloses this. The running app makes no AI/Gemini calls.
- **Fonts:** IBM Plex Sans Arabic, DM Sans, and Lora, served locally. License files are included in `public/fonts/`.

## Restyle or extend

Start with `@theme` in `src/index.css`: forest `#2F5D3A`, cream, earth, sage, sky, typography, radius, and spacing tokens are together. Feature CSS is in `src/styles/`. Logical inline/block properties support RTL. All interface text lives in Arabic and English translation files; API text can be localized plain text or a bundled key.

Unknown is a valid answer. Optional lab measurements remain `null`. Primary reading copy and form inputs use an 18px base, controls are touch-sized, focus is visible, native dialogs trap focus, and closed mobile navigation is inert. Interface transitions respect reduced-motion preferences.

## Browser smoke test

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright starts and stops a **test-only static file host** for `dist/`. It does not run or deploy a backend. Viewport projects cover 375px, 768px, and 1280px. The journey exercises Arabic/RTL, language switching, resumable setup, maps and boundaries, unknown history, analysis, insufficient-data handling, crop reorder, live demo scores, evidence, checklist persistence, printing, 3D, and methodology. Screenshots and failure traces go to `test-results/`.

Unit tests cover polygon area/validation, unknown answers, keyboard controls, insufficient-data routing, RTL, translation parity, mock/HTTP switching, HTTP request shapes, dataset lifecycle, scoring, rotations, surface geometry, unavailable WebGL, action plans, methodology, request failure/retry, stale-response protection, and the frontend-only data boundary.

## Data responsibility

All default values, scores, surfaces, time series, and plans are **simulated**. Approximate source scales are documentation examples, not live retrieval claims. Your backend must provide validated methods, actual periods and product versions, citations, uncertainty, farm-vs-pixel limitations, and verified recommendations. Coarse satellite data cannot replace field observations, soil tests, or local agronomic advice.

**Decision support, not a guarantee.**
