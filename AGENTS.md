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
3. **The landing intro is a bounded gate, staged like the finale** (`src/lib/stores/introSequence.ts`, identical on mobile). It is the **only** place the landing page may hold scroll — never extend hijacking beyond it:
   - **State 0 (`void`)** — on load: drifting starfield + title (eyebrow a beat later) only. No top bar, rail, HUD readouts, waypoint callouts, subcopy, stats, CTA, Earth, or airglow plate. The page is locked (stage pinned, scrollbar still visible).
   - While locked, every scroll input (wheel, touch drag, keys, scrollbar) **scrubs the intro timeline** instead of moving the page, capped at 2× natural speed (never under ~2.8 s, never skipped); left idle it plays on by itself. **State 1 (`departure`)**: the departure cue resolves and dissolves while Earth rises into frame. **State 2 (`journey`)**: chrome staggers in (top bar → readouts → rail → subcopy → CTA → stats).
   - The DOM side is pure CSS: the gate writes `--intro-s` (timeline seconds) on `<html>`, and `.intro-stage` + `.intro-slot-*` (`app.css`) and the hero's cue/airglow windows derive from it, matching `INTRO_BEATS`. New landing chrome must join a stagger slot rather than appear at load.
   - Escape hatches are mandatory: the discreet Skip affordance (~1 s in, until the chrome arrives), Esc, opening the chapters menu or telemetry drawer, keyboard focus leaving the hero, and any in-page navigation. It plays once per session (`sessionStorage`), and never for `prefers-reduced-motion` or a page that loads scrolled/deep-linked (`app.html` sets the first-paint state).
   - Release hands off in place (no jump, no re-layout) to the weighted journey; returning to the top does not re-gate.
4. **Landing scroll is weighted, never trapped** (`src/lib/stores/landingScroll.ts`): Lenis (lerp 0.1, `syncTouch` with a finger-exact drag) on `gsap.ticker`, synced to ScrollTrigger. Scroll-scrubbed motion (camera, parallax, finale) trails the scroll with `scrubToward`/`SCRUB_CATCH_UP_RATE`; the camera also has a hard speed cap (`MAX_JOURNEY_SPEED`) lifted only during fast travel. In-page navigation goes through `scrollToPosition` (eased fly-through ≤ 2.4 s); scrollbar, keyboard, find-in-page and text selection stay native. Reduced motion: no Lenis, instant jumps, instant scrubs.

## Architecture & Provenance Invariants

- **Routes**:
  - `/` — Fast cinematic trailer cut (`HeroSection` → 7-beat `LandingChapterStrip` with framed plates & alternating layout, flown as one continuous 3D camera journey → 3-beat `FinalePullBack`: Distance Alone → Quote Alone → Slow 4vh Milky Way Condensation; no trailing index grid). Journey beats repeat per waypoint (`src/lib/stores/landingJourney.ts`): panel over the waypoint → panel scrolls off → planet-only solo beat (~65vh, one mono label, no other overlay text) → flight → next panel rises as the camera settles. Waypoints in outward order: Prologue/Earth (also the hero), Ch I/Mars, Jupiter interlude (no panel), Ch II/Saturn, Ch III/Pluto & Charon, Ch IV/Heliopause, Ch V/Interstellar Medium, Epilogue/340 AU deep void. The camera faces sunward and backs outward: no body is visible before it is passed (none at page load besides Earth); each slides into view, then recedes. No Sun is drawn. Bodies live in one world space; never swap backgrounds or crossfade scenes.
  - `/chapters/[slug]` — Seven dynamic chapter deep-dive routes (`prologue`, `ch1-living-there`, `ch2-eyes-universe`, `ch3-long-reach`, `ch4-reusable-revolution`, `ch5-new-golden-age`, `epilogue`) containing 100% of the narrative prose, 29 milestones, schematics, deep-dive drawers, videos, 3D set pieces, and primary citations, with slim top bar and Prev/Next chapter navigation.
  - `/colophon` — Consolidated sources archive grouped by chapter, full `ASSETS.md` attributions, and the `BuiltByAiPanel` architecture showcase.
- **Dedupe & Provenance**: Keep `ASSETS.md`, `SOURCES.md`, and all licenses/credits intact; never duplicate hero imagery across adjacent landing beats.
