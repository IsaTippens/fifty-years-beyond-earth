# Fifty Years Beyond Earth — Agent & Engineering Rules (`AGENTS.md`)

## Core Legibility, Typography & Interactive Scene Invariants

1. **Balanced SVG & Telemetry Typography**:
   - Keep schematic, Oort Cloud, pull-back, and finale marker labels restrained across desktop and mobile (~20–30% smaller than oversized raw scaling) and build hierarchy with **weight** (`600` vs `400`), **tracking** (`letter-spacing`), and **opacity** (`0.94` vs `0.62`) — not raw size.
   - Over bright imagery (such as the Milky Way galactic plane), pair labels with a soft dark scrim/halo (`paint-order: stroke fill`, drop-shadow, or translucent `#050607` backing) and reduced mobile label sizing (no `[LABELS +]` expand button).
2. **No undismissable overlay may block an interactive scene**:
   - No panel may permanently cover an interactive 3D WebGL scene (`SaturnCassiniScene.svelte`, `ExoplanetOrrery.svelte`).
   - Position any desktop telemetry/caption overlays strictly at the outer margins of the 3D viewport, clear of the visual focal point.
   - Provide a persistent, obvious toggle chip (`DATA −` / `DATA +`) that collapses all readout panels to a single corner chip — **collapsed by default on mobile (`< 768px`)**.
   - Apply `pointer-events: none` (`pointer-events-none`) to all decorative overlay wrappers so drag-to-orbit works across the entire canvas; only actual interactive buttons/inputs take `pointer-events: auto`.
   - On mobile (`< 768px`), render readout panels **below** the 3D scene rather than overlapping the canvas.
3. **The landing intro is staged like the finale** (`src/lib/stores/introSequence.ts`, identical on mobile):
   - **State 0 (`void`)** — before any scroll: drifting starfield + title (eyebrow a beat later) only. No top bar, rail, HUD readouts, waypoint callouts, subcopy, stats, CTA, Earth, or airglow plate.
   - **State 1 (`departure`)** — first downward wheel/swipe/key at the top: the departure cue resolves and dissolves while Earth rises into frame as the camera eases back. Chrome stays hidden.
   - **Scroll is held at the top** from departure until the last stagger slot has faded in; only then may the page move on to the first chapter (gestures over the top bar and in text inputs pass through; scrollbar drags and jumps fall back to scroll-position staging).
   - **State 2 (`journey`)** — departure resolved: chrome staggers in (top bar → readouts → rail → subcopy → CTA → stats) via `.intro-stage` + `.intro-slot-*` in `app.css`.
   - Returning to the very top reverses the sequence (chrome retires in mirrored order; title and stars remain). New landing chrome must join a stagger slot rather than appear at load.

## Architecture & Provenance Invariants

- **Routes**:
  - `/` — Fast cinematic trailer cut (`HeroSection` → 7-beat `LandingChapterStrip` with framed plates & alternating layout, flown as one continuous 3D camera journey → 3-beat `FinalePullBack`: Distance Alone → Quote Alone → Slow 4vh Milky Way Condensation; no trailing index grid). Journey beats repeat per waypoint (`src/lib/stores/landingJourney.ts`): panel over the waypoint → panel scrolls off → planet-only solo beat (~65vh, one mono label, no other overlay text) → flight → next panel rises as the camera settles. Waypoints in outward order: Prologue/Earth (also the hero), Ch I/Mars, Jupiter interlude (no panel), Ch II/Saturn, Ch III/Pluto & Charon, Ch IV/Heliopause, Ch V/Interstellar Medium, Epilogue/340 AU deep void. Bodies live in one world space; never swap backgrounds or crossfade scenes.
  - `/chapters/[slug]` — Seven dynamic chapter deep-dive routes (`prologue`, `ch1-living-there`, `ch2-eyes-universe`, `ch3-long-reach`, `ch4-reusable-revolution`, `ch5-new-golden-age`, `epilogue`) containing 100% of the narrative prose, 29 milestones, schematics, deep-dive drawers, videos, 3D set pieces, and primary citations, with slim top bar and Prev/Next chapter navigation.
  - `/colophon` — Consolidated sources archive grouped by chapter, full `ASSETS.md` attributions, and the `BuiltByAiPanel` architecture showcase.
- **Dedupe & Provenance**: Keep `ASSETS.md`, `SOURCES.md`, and all licenses/credits intact; never duplicate hero imagery across adjacent landing beats.
