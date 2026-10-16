# Fifty Years Beyond Earth — Agent & Engineering Rules (`AGENTS.md`)

## Core Legibility, Typography & Interactive Scene Invariants

1. **12px effective type floor, including inside SVGs**:
   - Enforce an effective rendered font-size floor across every viewport width (`1440px` desktop down to `390px` mobile): **12px minimum for any label**, **11px minimum for captions**, including `<text>` inside SVGs.
   - Because SVG `<text>` scales with its `viewBox`, always compute or counter-scale the effective rendered pixel size at the SVG's actual rendered width (or place the SVG in an `overflow-x-auto` container with `min-w-[viewBoxWidth]` / move labels to HTML overlays positioned in CSS pixels) so no label ever drops below 12px effective rendered height or requires squinting at arm's length.
   - Over bright imagery (such as the Milky Way galactic plane), pair labels with a soft dark scrim/halo (`paint-order: stroke fill`, drop-shadow, or translucent `#050607` backing). On mobile (`< 768px`) in the Milky Way finale, display only the primary `YOU ARE HERE · SOL` and `VOYAGER 1 & 2` labels by default; reveal secondary galactic/stellar labels on tap (`[LABELS +]`).

2. **No undismissable overlay may block an interactive scene**:
   - No panel may permanently cover an interactive 3D WebGL scene (`SaturnCassiniScene.svelte`, `ExoplanetOrrery.svelte`).
   - Position any desktop telemetry/caption overlays strictly at the outer margins of the 3D viewport, clear of the visual focal point.
   - Provide a persistent, obvious toggle chip (`DATA −` / `DATA +`) that collapses all readout panels to a single corner chip — **collapsed by default on mobile (`< 768px`)**.
   - Apply `pointer-events: none` (`pointer-events-none`) to all decorative overlay wrappers so drag-to-orbit works across the entire canvas; only actual interactive buttons/inputs take `pointer-events: auto`.
   - On mobile (`< 768px`), render readout panels **below** the 3D scene rather than overlapping the canvas.

## Architecture & Provenance Invariants

- **Routes**:
  - `/` — Fast cinematic trailer cut (`HeroSection` → 7-beat `LandingChapterStrip` → `FinalePullBack` → `"Continue the Journey"` chapter index grid) in ~8–12 viewport heights.
  - `/chapters/[slug]` — Seven dynamic chapter deep-dive routes (`prologue`, `ch1-living-there`, `ch2-eyes-universe`, `ch3-long-reach`, `ch4-reusable-revolution`, `ch5-new-golden-age`, `epilogue`) containing 100% of the narrative prose, 29 milestones, schematics, deep-dive drawers, videos, 3D set pieces, and primary citations, with slim top bar and Prev/Next chapter navigation.
  - `/colophon` — Consolidated sources archive grouped by chapter, full `ASSETS.md` attributions, and the `BuiltByAiPanel` architecture showcase.
- **Dedupe & Provenance**: Keep `ASSETS.md`, `SOURCES.md`, and all licenses/credits intact; never duplicate hero imagery across adjacent landing beats.
