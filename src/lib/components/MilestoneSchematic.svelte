<script lang="ts">
	import type { MilestoneData } from '$lib/data/missions';

	interface Props {
		milestone: MilestoneData;
		hubbleCostarActive: boolean;
		ligoDetectorOverlay: 'both' | 'h1' | 'l1';
		jwstPhased: boolean;
	}

	let { milestone, hubbleCostarActive, ligoDetectorOverlay, jwstPhased }: Props = $props();
	const id = $derived(milestone.id);
</script>

{#if id === 'apollo-soyuz-1975'}
	<!-- 01. Apollo-Soyuz APAS-75 Androgynous Docking & Airlock Pressure-Equalization Cross-Section -->
	<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Apollo-Soyuz APAS-75 Docking Schematic">
		<rect width="800" height="220" fill="#050607" />
		<path d="M 20 190 Q 400 140 780 190" fill="none" stroke="rgba(232,230,225,0.22)" stroke-width="1.2" stroke-dasharray="4 4" />
		<g transform="translate(80, 56)" stroke="#E8E6E1" fill="none">
			<rect x="0" y="20" width="110" height="68" rx="2" fill="rgba(232,230,225,0.03)" stroke-width="1.3" />
			<polygon points="-36,10 0,28 0,80 -36,98" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.5)" stroke-width="1.1" />
			<polygon points="110,20 165,36 165,72 110,88" fill="rgba(232,230,225,0.04)" stroke-width="1.3" />
			<rect x="165" y="34" width="115" height="40" fill="rgba(200,155,87,0.08)" stroke="#C89B57" stroke-width="1.4" />
			<text x="15" y="52" fill="#E8E6E1" stroke="none" font-family="monospace" font-size="10">APOLLO CSM-111</text>
			<text x="15" y="68" fill="rgba(232,230,225,0.6)" stroke="none" font-family="monospace" font-size="8.5">100% O₂ @ 34 kPa (5 psi)</text>
			<text x="172" y="52" fill="#C89B57" stroke="none" font-family="monospace" font-size="9">DOCKING MODULE</text>
			<text x="172" y="65" fill="rgba(232,230,225,0.6)" stroke="none" font-family="monospace" font-size="8">APAS-75 / N₂-O₂ Lock</text>
		</g>
		<g transform="translate(360, 74)">
			<line x1="0" y1="-15" x2="0" y2="90" stroke="#C89B57" stroke-width="1.2" stroke-dasharray="3 3" />
			<circle cx="0" cy="36" r="24" fill="none" stroke="#C89B57" stroke-width="1.6" />
			<text x="-62" y="-22" fill="#C89B57" font-family="monospace" font-size="9.5">17 JUL 1975 · 16:12 UTC (222 KM LEO)</text>
		</g>
		<g transform="translate(364, 56)" stroke="#E8E6E1" fill="none">
			<ellipse cx="52" cy="54" rx="46" ry="34" fill="rgba(232,230,225,0.03)" stroke-width="1.3" />
			<path d="M 98 28 L 164 22 L 164 86 L 98 80 Z" fill="rgba(232,230,225,0.04)" stroke-width="1.3" />
			<rect x="164" y="26" width="90" height="56" fill="rgba(232,230,225,0.02)" stroke-width="1.3" />
			<line x1="208" y1="-26" x2="208" y2="134" stroke="#C89B57" stroke-width="2" />
			<text x="20" y="52" fill="#E8E6E1" stroke="none" font-family="monospace" font-size="9.5">SOYUZ 19</text>
			<text x="18" y="65" fill="rgba(232,230,225,0.6)" stroke="none" font-family="monospace" font-size="8">N₂/O₂ @ 68 kPa</text>
			<text x="170" y="56" fill="rgba(232,230,225,0.65)" stroke="none" font-family="monospace" font-size="9">7K-TM PAO</text>
		</g>
	</svg>
{:else if id === 'viking-mars-1976'}
	<!-- 02. Viking 1 & 2 Mars Aeroshell Entry Deceleration Corridor -->
	<svg viewBox="0 0 800 215" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Viking Mars Entry Descent and Landing Profile">
		<rect width="800" height="215" fill="#050607" />
		<path d="M 20 182 Q 400 162 780 182" fill="none" stroke="#C89B57" stroke-width="1.4" />
		<line x1="20" y1="44" x2="780" y2="44" stroke="rgba(232,230,225,0.16)" stroke-dasharray="4 4" />
		<text x="28" y="36" fill="rgba(232,230,225,0.55)" font-family="monospace" font-size="8.5">MARS ATMOSPHERIC ENTRY INTERFACE (125 KM // 4.6 KM/S)</text>
		<path d="M 85 44 Q 260 82 420 124 T 640 172" fill="none" stroke="#E8E6E1" stroke-width="1.6" />
		{#each [
			{ x: 140, y: 58, l: '70° BICONIC AEROSHELL PEAK DECEL' },
			{ x: 350, y: 106, l: '16m DISK-GAP-BAND PARACHUTE (5.8 KM)' },
			{ x: 520, y: 148, l: '18-NOZZLE HYDRAZINE TERMINAL DESCENT' },
			{ x: 640, y: 172, l: 'CHRYSE & UTOPIA PLANITIA TOUCHDOWN' }
		] as pt, idx}
			<circle cx={pt.x} cy={pt.y} r="4" fill={idx === 3 ? '#C89B57' : '#E8E6E1'} />
			<text x={pt.x - 10} y={pt.y - 12} fill={idx === 3 ? '#C89B57' : '#E8E6E1'} font-family="monospace" font-size="8.5">{pt.l}</text>
		{/each}
	</svg>
{:else if id === 'voyager-golden-record-1977'}
	<!-- 03. Voyager 1 & 2 Gravity-Assist Heliocentric Velocity vs. Solar Escape Velocity Step Chart -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Voyager Gravity-Assist Heliocentric Velocity Step Chart">
		<rect width="800" height="225" fill="#050607" />
		<!-- Axes & Grid -->
		<line x1="68" y1="26" x2="68" y2="188" stroke="rgba(232,230,225,0.28)" stroke-width="1.2" />
		<line x1="68" y1="188" x2="765" y2="188" stroke="rgba(232,230,225,0.28)" stroke-width="1.2" />
		{#each [
			{ v: '40 km/s', y: 40 },
			{ v: '30 km/s', y: 77 },
			{ v: '20 km/s', y: 114 },
			{ v: '10 km/s', y: 151 }
		] as tick}
			<line x1="68" y1={tick.y} x2="765" y2={tick.y} stroke="rgba(232,230,225,0.08)" stroke-dasharray="3 3" />
			<text x="60" y={tick.y + 3} text-anchor="end" fill="rgba(232,230,225,0.55)" font-family="monospace" font-size="8.5">{tick.v}</text>
		{/each}
		<!-- Solar System Escape Velocity Curve v_esc(r) = 42.1 / sqrt(r) -->
		<path
			d="M 80 34 Q 155 110 245 142 Q 360 156 490 165 T 755 176"
			fill="none"
			stroke="rgba(232,230,225,0.42)"
			stroke-width="1.5"
			stroke-dasharray="5 3"
		/>
		<text x="115" y="174" fill="rgba(232,230,225,0.62)" font-family="monospace" font-size="8.5">SOLAR ESCAPE THRESHOLD v_esc(r) = 42.1/√r km/s</text>

		<!-- Voyager 1 Heliocentric Velocity Step Profile (Jupiter 1979 +10.5 km/s, Saturn 1980 +5.2 km/s) -->
		<path
			d="M 80 54 Q 165 128 245 148 L 245 86 Q 320 124 405 140 L 405 104 Q 530 120 755 125"
			fill="none"
			stroke="#C89B57"
			stroke-width="2.2"
		/>
		<!-- Voyager 2 4-Planet Step Profile (Jupiter, Saturn, Uranus 1986, Neptune 1989) -->
		<path
			d="M 80 58 Q 165 132 252 150 L 252 98 Q 328 130 412 145 L 412 114 Q 485 134 555 144 L 555 126 Q 615 136 670 140 L 670 131 L 755 133"
			fill="none"
			stroke="#E8E6E1"
			stroke-width="1.5"
		/>
		{#each [
			{ x: 80, y: 54, tx: 88, ty: 44, l: '1 AU LAUNCH (36 km/s)', c: '#E8E6E1' },
			{ x: 245, y: 86, tx: 215, ty: 72, l: 'JUPITER SLINGSHOT (+10.5 km/s)', c: '#C89B57' },
			{ x: 405, y: 104, tx: 375, ty: 90, l: 'SATURN SLINGSHOT (+5.2 km/s)', c: '#C89B57' },
			{ x: 555, y: 126, tx: 515, ty: 156, l: 'URANUS (19.2 AU)', c: '#E8E6E1' },
			{ x: 670, y: 131, tx: 645, ty: 156, l: 'NEPTUNE (30.1 AU)', c: '#E8E6E1' }
		] as node}
			<circle cx={node.x} cy={node.y} r="4" fill={node.c} />
			<text x={node.tx} y={node.ty} fill={node.c} font-family="monospace" font-size="8">{node.l}</text>
		{/each}
		<text x="548" y="108" fill="#C89B57" font-family="monospace" font-size="8.5">VOYAGER 1 v_∞ = 17.0 km/s (UNBOUND)</text>
		<text x="395" y="208" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">HELIOCENTRIC DISTANCE (1 AU → 5.2 AU → 9.5 AU → 30.1 AU → INTERSTELLAR)</text>
	</svg>
{:else if id === 'sts-1-columbia-1981'}
	<!-- 04. Space Shuttle Orbiter TPS Isotherm & Mach 25 Bow-Shock Profile -->
	<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Space Shuttle Columbia TPS Isotherm Schematic">
		<rect width="800" height="220" fill="#050607" />
		<path d="M 110 110 Q 140 20 520 12" fill="none" stroke="#C89B57" stroke-width="1.8" stroke-dasharray="6 4" />
		<path d="M 110 110 Q 140 200 520 208" fill="none" stroke="#C89B57" stroke-width="2" />
		<text x="24" y="45" fill="#C89B57" font-family="monospace" font-size="9.5">MACH 25 BOW SHOCK // α = 40°</text>
		<g transform="translate(135, 36)">
			<path d="M 15 74 L 130 52 L 265 6 L 345 6 L 345 142 L 265 142 L 130 96 Z" fill="rgba(232,230,225,0.03)" stroke="#E8E6E1" stroke-width="1.8" />
			<path d="M 45 74 L 145 58 L 270 22 L 325 22 L 325 126 L 270 126 L 145 90 Z" fill="rgba(200,155,87,0.06)" stroke="#C89B57" stroke-width="1.2" />
			<path d="M 12 74 Q 26 60 44 62 L 44 86 Q 26 88 12 74 Z" fill="#C89B57" />
			<text x="155" y="78" fill="#E8E6E1" font-family="monospace" font-size="10">24,300 LI-900 SILICA TILES</text>
		</g>
		<g transform="translate(530, 34)" font-family="monospace" font-size="9.5">
			<rect x="0" y="0" width="245" height="150" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.18)" />
			<circle cx="18" cy="28" r="4" fill="#C89B57" />
			<text x="32" y="31" fill="#E8E6E1">RCC Nose &amp; Wing Edge: 1,650 °C</text>
			<circle cx="18" cy="60" r="4" fill="#DDB474" />
			<text x="32" y="63" fill="rgba(232,230,225,0.8)">HRSI Black Silica Tiles: 1,260 °C</text>
			<circle cx="18" cy="92" r="4" fill="#E8E6E1" />
			<text x="32" y="95" fill="rgba(232,230,225,0.65)">LRSI White Silica Tiles: 650 °C</text>
			<circle cx="18" cy="124" r="4" fill="rgba(232,230,225,0.44)" />
			<text x="32" y="127" fill="rgba(232,230,225,0.55)">FRSI Felt Blankets: &lt; 370 °C</text>
		</g>
	</svg>
{:else if id === 'mir-station-1986'}
	<!-- 05. Mir 6-Port Spherical Docking Node & Lyappa Radial Arm Cluster (1986–1996) -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Mir Space Station 6-Port Radial Cluster Schematic">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: 6-Port Spherical Docking Node & Lyappa 90-deg Pivoting Arm -->
		<g transform="translate(390, 118)">
			<!-- Central 6-port spherical docking adapter -->
			<circle cx="0" cy="0" r="18" fill="rgba(200,155,87,0.18)" stroke="#C89B57" stroke-width="1.8" />
			<!-- Longitudinal Axis: DOS-7 Core Module (Right) + Kvant-1 + Soyuz TM (East) -->
			<rect x="18" y="-14" width="135" height="28" fill="rgba(232,230,225,0.06)" stroke="#E8E6E1" stroke-width="1.5" />
			<rect x="153" y="-11" width="58" height="22" fill="rgba(200,155,87,0.10)" stroke="#C89B57" stroke-width="1.3" />
			<rect x="211" y="-8" width="44" height="16" fill="rgba(232,230,225,0.04)" stroke="#E8E6E1" stroke-width="1.1" />
			<!-- Forward Axial Port: Soyuz / Shuttle Kristall APAS-89 -->
			<rect x="-64" y="-10" width="46" height="20" fill="rgba(232,230,225,0.04)" stroke="rgba(232,230,225,0.65)" stroke-width="1.2" stroke-dasharray="3 2" />
			<!-- Radial North: Kvant-2 EVA & Gyrodyne Module -->
			<rect x="-13" y="-76" width="26" height="58" fill="rgba(232,230,225,0.05)" stroke="#E8E6E1" stroke-width="1.4" />
			<!-- Radial South: Spektr / Kristall Module -->
			<rect x="-13" y="18" width="26" height="58" fill="rgba(232,230,225,0.05)" stroke="#E8E6E1" stroke-width="1.4" />
			<!-- Diagonal Port/Starboard Projections: Kristall & Priroda -->
			<polygon points="-14,-14 -88,-68 -74,-82 -2,-24" fill="rgba(200,155,87,0.08)" stroke="#C89B57" stroke-width="1.2" />
			<polygon points="-14,14 -88,68 -74,82 -2,24" fill="rgba(200,155,87,0.08)" stroke="#C89B57" stroke-width="1.2" />
			<!-- Lyappa 90-degree mechanical transfer arc -->
			<path d="M -52 0 A 52 52 0 0 1 0 -52" fill="none" stroke="#C89B57" stroke-width="1.5" stroke-dasharray="4 3" />
			<text x="-175" y="-42" fill="#C89B57" font-family="monospace" font-size="8.5">LYAPPA 90° PIVOT ARM →</text>
			<text x="28" y="4" fill="#E8E6E1" font-family="monospace" font-size="9">DOS-7 CORE (1986)</text>
			<text x="157" y="4" fill="#C89B57" font-family="monospace" font-size="8">KVANT-1</text>
			<text x="20" y="-65" fill="#E8E6E1" font-family="monospace" font-size="8.5">KVANT-2 (1989)</text>
			<text x="20" y="68" fill="#E8E6E1" font-family="monospace" font-size="8.5">SPEKTR (1995)</text>
			<text x="-185" y="-76" fill="rgba(232,230,225,0.75)" font-family="monospace" font-size="8.5">KRISTALL (1990)</text>
			<text x="-185" y="84" fill="rgba(232,230,225,0.75)" font-family="monospace" font-size="8.5">PRIRODA (1996)</text>
		</g>
		<text x="26" y="26" fill="#E8E6E1" font-family="monospace" font-size="9.5">6-PORT RADIAL NODE ARCHITECTURE · 7 PRESSURIZED MODULES (129.7 TONNES)</text>
		<text x="26" y="208" fill="#C89B57" font-family="monospace" font-size="9">RECORD: VALERI POLYAKOV 437.75 CONTINUOUS DAYS IN LEO (358 KM)</text>
	</svg>
{:else if id === 'giotto-halley-1986'}
	<!-- 06. Giotto 596 km Hypervelocity Encounter with Comet 1P/Halley Nucleus & Whipple Shield -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Giotto Comet Halley Nucleus Flyby and Whipple Shield Schematic">
		<rect width="800" height="225" fill="#050607" />
		<!-- Sunward Vector (Left) -->
		<line x1="28" y1="65" x2="115" y2="65" stroke="#C89B57" stroke-width="1.5" />
		<polygon points="115,61 124,65 115,69" fill="#C89B57" />
		<text x="28" y="53" fill="#C89B57" font-family="monospace" font-size="8.5">SOLAR RADIATION (0.89 AU)</text>

		<!-- 1P/Halley 15x8 km Dark Peanut Nucleus (Albedo 0.04) & Sunward Dust/Gas Jets -->
		<g transform="translate(310, 102)">
			<!-- Coma bow shock & ion tail -->
			<path d="M -130 0 Q -110 -88 180 -92" fill="none" stroke="rgba(232,230,225,0.2)" stroke-dasharray="4 4" />
			<path d="M -130 0 Q -110 88 180 92" fill="none" stroke="rgba(232,230,225,0.2)" stroke-dasharray="4 4" />
			<!-- Sunward collimated dust jets from active vents -->
			<polygon points="-32,-12 -145,-58 -125,-18" fill="rgba(200,155,87,0.18)" />
			<polygon points="-36,8 -155,22 -130,52" fill="rgba(200,155,87,0.18)" />
			<polygon points="-18,16 -110,68 -78,78" fill="rgba(232,230,225,0.12)" />
			<!-- 15x8 km Peanut Nucleus -->
			<path
				d="M -38 -14 C -22 -28, 2 -18, 14 -14 C 32 -22, 54 -14, 56 4 C 58 22, 34 28, 12 18 C -4 14, -24 26, -38 12 C -46 2, -46 -6, -38 -14 Z"
				fill="#141518"
				stroke="#E8E6E1"
				stroke-width="1.8"
			/>
			<text x="-38" y="-34" fill="#E8E6E1" font-family="monospace" font-size="9.5">1P/HALLEY NUCLEUS (15 × 8 KM · ALBEDO 0.04)</text>
		</g>

		<!-- Giotto 68.37 km/s Retrograde Intercept Chord at 596 km -->
		<line x1="60" y1="176" x2="540" y2="146" stroke="#C89B57" stroke-width="2" />
		<circle cx="312" cy="160" r="5" fill="#C89B57" />
		<line x1="310" y1="116" x2="312" y2="160" stroke="#E8E6E1" stroke-width="1.1" stroke-dasharray="2 2" />
		<text x="195" y="196" fill="#C89B57" font-family="monospace" font-size="9">CLOSEST APPROACH: 596 KM @ 68.37 KM/S (14 MAR 1986)</text>

		<!-- Right Inset: Two-Stage Whipple Bumper Shield Cross-Section -->
		<g transform="translate(555, 34)">
			<rect x="0" y="0" width="220" height="154" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.18)" />
			<text x="12" y="20" fill="#C89B57" font-family="monospace" font-size="8.5">WHIPPLE DUAL DUST BUMPER</text>
			<!-- 1 mm Aluminum Front Sheet -->
			<line x1="48" y1="34" x2="48" y2="136" stroke="#E8E6E1" stroke-width="2.5" />
			<text x="54" y="46" fill="#E8E6E1" font-family="monospace" font-size="7.5">1.0 mm Al Front Sheet</text>
			<!-- 23 cm Spacing + Debris Cloud Expansion -->
			<polygon points="48,85 138,54 138,116" fill="rgba(200,155,87,0.16)" stroke="#C89B57" stroke-width="0.9" stroke-dasharray="2 2" />
			<line x1="14" y1="85" x2="46" y2="85" stroke="#C89B57" stroke-width="1.8" />
			<circle cx="48" cy="85" r="3.5" fill="#C89B57" />
			<text x="60" y="88" fill="#C89B57" font-family="monospace" font-size="7.5">23 cm Vaporization Gap</text>
			<!-- 13.5 mm Kevlar/Foam Rear Catcher -->
			<line x1="140" y1="34" x2="140" y2="136" stroke="#C89B57" stroke-width="4" />
			<text x="54" y="132" fill="rgba(232,230,225,0.7)" font-family="monospace" font-size="7.5">13.5 mm Kevlar Rear Shield</text>
		</g>
	</svg>
{:else if id === 'iss-assembly-1998'}
	<!-- 07. ISS 109m Integrated Truss Backbone, SARJ Solar Wings & Pressurized Module Sequence -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="International Space Station 109m Truss and Module Assembly Schematic">
		<rect width="800" height="225" fill="#050607" />
		<!-- 109m Integrated Truss Structure (P6, P4, P3/P1, S0, S1/S3, S4, S6) -->
		<rect x="64" y="102" width="672" height="14" fill="rgba(232,230,225,0.06)" stroke="#E8E6E1" stroke-width="1.4" />
		<!-- Alpha Solar Rotary Joints (SARJ) -->
		<circle cx="196" cy="109" r="7" fill="#050607" stroke="#C89B57" stroke-width="1.6" />
		<circle cx="604" cy="109" r="7" fill="#050607" stroke="#C89B57" stroke-width="1.6" />
		<!-- 8 Photovoltaic Solar Array Wings (SAW) spanning 73m -->
		{#each [92, 148, 652, 708] as xWing}
			<rect x={xWing - 20} y="18" width="40" height="78" fill="rgba(200,155,87,0.10)" stroke="#C89B57" stroke-width="1.2" />
			<line x1={xWing} y1="18" x2={xWing} y2="96" stroke="rgba(200,155,87,0.45)" stroke-width="0.9" />
			<rect x={xWing - 20} y="122" width="40" height="78" fill="rgba(200,155,87,0.10)" stroke="#C89B57" stroke-width="1.2" />
			<line x1={xWing} y1="122" x2={xWing} y2="200" stroke="rgba(200,155,87,0.45)" stroke-width="0.9" />
		{/each}
		<!-- Thermal Radiator Panels -->
		<rect x="268" y="120" width="26" height="48" fill="rgba(232,230,225,0.08)" stroke="rgba(232,230,225,0.5)" stroke-width="1" />
		<rect x="506" y="120" width="26" height="48" fill="rgba(232,230,225,0.08)" stroke="rgba(232,230,225,0.5)" stroke-width="1" />
		<!-- Longitudinal Pressurized Spine (Zvezda -> Zarya -> Unity -> Destiny -> Harmony + Columbus / Kibo) -->
		<rect x="384" y="30" width="32" height="158" fill="rgba(232,230,225,0.07)" stroke="#E8E6E1" stroke-width="1.5" />
		<!-- Columbus (Starboard) & Kibo JEM (Port) -->
		<rect x="330" y="148" width="54" height="22" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="1.3" />
		<rect x="416" y="148" width="44" height="22" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="1.3" />
		<text x="275" y="22" fill="#E8E6E1" font-family="monospace" font-size="9">109m INTEGRATED TRUSS (S6 → S0 → P6) · 420 TONNES</text>
		<text x="424" y="48" fill="#E8E6E1" font-family="monospace" font-size="8">ZVEZDA / ZARYA (1998)</text>
		<text x="424" y="88" fill="#C89B57" font-family="monospace" font-size="8">UNITY NODE 1 + DESTINY</text>
		<text x="242" y="184" fill="#C89B57" font-family="monospace" font-size="8">JEM KIBO + COLUMBUS LABS</text>
		<text x="242" y="212" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8.5">40+ ASSEMBLY FLIGHTS · CONTINUOUS CREW SINCE NOV 2, 2000</text>
	</svg>
{:else if id === 'hubble-launch-1990'}
	<!-- 08. Hubble 1990 Primary Mirror Cross-Section & Null-Corrector −2.2 μm Spherical Aberration -->
	<svg viewBox="0 0 800 230" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Hubble 1990 Primary Mirror Spherical Aberration Cross Section">
		<rect width="800" height="230" fill="#050607" />
		<!-- Left: Perkin-Elmer Reflective Null Corrector 1.3 mm Spacing Error -->
		<g transform="translate(28, 28)">
			<rect x="0" y="0" width="235" height="172" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.18)" />
			<text x="12" y="20" fill="#C89B57" font-family="monospace" font-size="8.5">NULL CORRECTOR METER ROD ERROR</text>
			<line x1="35" y1="78" x2="195" y2="78" stroke="rgba(232,230,225,0.25)" stroke-dasharray="3 3" />
			<!-- Field lens & two spherical mirrors -->
			<ellipse cx="62" cy="78" rx="6" ry="26" fill="rgba(232,230,225,0.08)" stroke="#E8E6E1" stroke-width="1.3" />
			<path d="M 132 42 Q 116 78 132 114" fill="none" stroke="#E8E6E1" stroke-width="2" />
			<!-- Displaced Field Cap (+1.3 mm) -->
			<line x1="176" y1="46" x2="176" y2="110" stroke="rgba(232,230,225,0.4)" stroke-dasharray="2 2" />
			<line x1="194" y1="46" x2="194" y2="110" stroke="#C89B57" stroke-width="2" />
			<text x="42" y="134" fill="#E8E6E1" font-family="monospace" font-size="8">Missing anti-reflection paint</text>
			<text x="42" y="148" fill="#C89B57" font-family="monospace" font-size="8.5">Δz = +1.30 mm washer offset</text>
			<text x="42" y="162" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8">Conic K = −1.0139 (vs −1.0023)</text>
		</g>

		<!-- Right: 2.4m Hyperbolic Primary Mirror Edge Error (−2.2 μm) & 38 mm Focal Spread -->
		<g transform="translate(290, 22)">
			<text x="0" y="12" fill="#E8E6E1" font-family="monospace" font-size="9.5">2.4m PRIMARY MIRROR SURFACE DEVIATION &amp; CAUSTIC FOCUS SPREAD</text>
			<!-- Intended Hyperbola vs Ground Over-Flattened Perimeter -->
			<path d="M 55 32 Q 18 106 55 180" fill="none" stroke="rgba(232,230,225,0.4)" stroke-width="2" stroke-dasharray="4 3" />
			<path d="M 66 32 Q 18 106 66 180" fill="none" stroke="#C89B57" stroke-width="3" />
			<text x="8" y="28" fill="#C89B57" font-family="monospace" font-size="8">−2.2 μm edge</text>
			<!-- Paraxial Rays (Inner) focus at x=310 -->
			<polyline points="220,76 32,76 310,106" fill="none" stroke="#E8E6E1" stroke-width="1.4" />
			<polyline points="220,136 32,136 310,106" fill="none" stroke="#E8E6E1" stroke-width="1.4" />
			<!-- Marginal Rays (Outer 2.4m rim) focus 38 mm further at x=415 -->
			<polyline points="220,38 58,38 415,106" fill="none" stroke="#C89B57" stroke-width="1.6" />
			<polyline points="220,174 58,174 415,106" fill="none" stroke="#C89B57" stroke-width="1.6" />
			<!-- 38 mm Longitudinal Spherical Aberration Caliper -->
			<line x1="310" y1="68" x2="310" y2="144" stroke="#E8E6E1" stroke-dasharray="3 3" />
			<line x1="415" y1="68" x2="415" y2="144" stroke="#C89B57" stroke-dasharray="3 3" />
			<line x1="310" y1="140" x2="415" y2="140" stroke="#C89B57" stroke-width="1.4" />
			<text x="315" y="156" fill="#C89B57" font-family="monospace" font-size="8.5">Δf = +38 mm focal spread</text>
			<text x="275" y="182" fill="rgba(232,230,225,0.7)" font-family="monospace" font-size="8.5">15% encircled energy in 0.1″ core (85% in 1.5″ halo)</text>
		</g>
	</svg>
{:else if id === 'hubble-repair-1993'}
	<!-- 09. Hubble STS-61 Servicing Mission 1: COSTAR M1/M2 Corrective Optics & PSF Restoration -->
	<svg viewBox="0 0 800 235" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Hubble 1993 COSTAR Corrective Optics and Encircled Energy Restoration">
		<rect width="800" height="235" fill="#050607" />
		{#each [40, 70, 100] as x}
			<line x1={x} y1="30" x2={x} y2="205" stroke="rgba(232,230,225,0.22)" stroke-width="1.1" stroke-dasharray="3 3" />
		{/each}
		<text x="26" y="22" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="9">INCOMING PARALLEL WAVEFRONT</text>
		<path d="M 380 24 Q 345 117 380 210" fill="none" stroke="#E8E6E1" stroke-width="4" />
		<text x="295" y="224" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="9">2.4m PRIMARY MIRROR + STS-61 5-EVA SERVICING</text>
		<path d="M 175 88 Q 190 117 175 146" fill="none" stroke="#E8E6E1" stroke-width="3" />

		{#if !hubbleCostarActive}
			<polyline points="40,42 372,42 182,102 520,136" fill="none" stroke="rgba(232,230,225,0.45)" stroke-width="1.4" stroke-dasharray="4 3" />
			<polyline points="40,192 372,192 182,132 520,98" fill="none" stroke="rgba(232,230,225,0.45)" stroke-width="1.4" stroke-dasharray="4 3" />
			<polyline points="40,78 362,78 184,110 568,117" fill="none" stroke="#C89B57" stroke-width="1.4" />
			<polyline points="40,156 362,156 184,124 568,117" fill="none" stroke="#C89B57" stroke-width="1.4" />
			<circle cx="675" cy="117" r="46" fill="rgba(232,230,225,0.05)" stroke="rgba(232,230,225,0.4)" stroke-dasharray="3 3" />
			<circle cx="675" cy="117" r="24" fill="rgba(200,155,87,0.16)" />
			<circle cx="675" cy="117" r="5" fill="#E8E6E1" />
			<text x="568" y="34" fill="#C89B57" font-family="monospace" font-size="10">1990 ABERRATED PSF: 15% ENCIRCLED ENERGY</text>
			<text x="568" y="192" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="9">Marginal rays focus 38 mm beyond paraxial focus</text>
		{:else}
			<polyline points="40,42 372,42 182,102 470,114 568,117" fill="none" stroke="#C89B57" stroke-width="1.5" />
			<polyline points="40,192 372,192 182,132 470,120 568,117" fill="none" stroke="#C89B57" stroke-width="1.5" />
			<polyline points="40,78 362,78 184,110 470,116 568,117" fill="none" stroke="#E8E6E1" stroke-width="1.3" />
			<polyline points="40,156 362,156 184,124 470,118 568,117" fill="none" stroke="#E8E6E1" stroke-width="1.3" />
			<rect x="458" y="96" width="24" height="42" rx="2" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="1.4" />
			<text x="430" y="88" fill="#C89B57" font-family="monospace" font-size="9">COSTAR / WFPC2 (+2.2 μm)</text>
			<circle cx="675" cy="117" r="14" fill="none" stroke="#C89B57" stroke-opacity="0.55" stroke-width="1.2" />
			<circle cx="675" cy="117" r="4" fill="#E8E6E1" />
			<text x="568" y="34" fill="#E8E6E1" font-family="monospace" font-size="10">1993 CORRECTED PSF: 84% ENCIRCLED ENERGY</text>
			<text x="568" y="192" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="9">0.05 arcsec diffraction-limited resolution restored</text>
		{/if}
	</svg>
{:else if id === 'mars-pathfinder-sojourner-1997'}
	<!-- 10. Mars Pathfinder RAD Rocket + 24-Lobe Tetrahedron Airbag Bounce Attenuation Profile -->
	<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Mars Pathfinder Tetrahedron Airbag Bounce Profile">
		<rect width="800" height="220" fill="#050607" />
		<!-- Ares Vallis Floodplain Ground Line -->
		<line x1="30" y1="184" x2="770" y2="184" stroke="#C89B57" stroke-width="1.5" />
		<!-- RAD Solid Retro-Rocket Ignition & Bridle Cut at 21.5m -->
		<line x1="78" y1="28" x2="78" y2="96" stroke="#E8E6E1" stroke-width="1.5" stroke-dasharray="4 3" />
		<polygon points="78,86 68,108 88,108" fill="rgba(200,155,87,0.35)" stroke="#C89B57" stroke-width="1.2" />
		<text x="28" y="22" fill="#E8E6E1" font-family="monospace" font-size="8.5">3× RAD RETRO-ROCKETS (98 m → 21.5 m BRIDLE CUT)</text>

		<!-- 15-Bounce Damped Ballistic Attenuation Curve across 1 km of Ares Vallis -->
		<path
			d="M 78 96 Q 112 120 135 184 Q 185 68 235 184 Q 275 104 315 184 Q 348 128 380 184 Q 406 144 432 184 Q 454 156 476 184 Q 494 166 512 184 Q 528 172 544 184 L 610 184"
			fill="none"
			stroke="#C89B57"
			stroke-width="2"
		/>
		<circle cx="135" cy="184" r="4.5" fill="#C89B57" />
		<text x="115" y="202" fill="#C89B57" font-family="monospace" font-size="8.5">IMPACT #1: 14 m/s (18.7 g · 15.7 m BOUNCE)</text>
		<text x="365" y="202" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8.5">15+ BOUNCES ACROSS ~1.0 KM → PETAL DEPLOY</text>

		<!-- Right Inset: 4-Sided Tetrahedron & 24 Vectran Airbag Lobes + 10.6 kg Sojourner -->
		<g transform="translate(565, 28)">
			<rect x="0" y="0" width="205" height="142" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.18)" />
			<polygon points="102,28 56,104 148,104" fill="rgba(200,155,87,0.10)" stroke="#C89B57" stroke-width="1.4" />
			<circle cx="102" cy="54" r="24" fill="none" stroke="#E8E6E1" stroke-width="1.1" stroke-dasharray="3 2" />
			<circle cx="78" cy="92" r="24" fill="none" stroke="#E8E6E1" stroke-width="1.1" stroke-dasharray="3 2" />
			<circle cx="126" cy="92" r="24" fill="none" stroke="#E8E6E1" stroke-width="1.1" stroke-dasharray="3 2" />
			<text x="14" y="18" fill="#E8E6E1" font-family="monospace" font-size="8.5">24-LOBE VECTRAN AIRBAG</text>
			<text x="14" y="128" fill="#C89B57" font-family="monospace" font-size="8">SOJOURNER 6-WHEEL ROVER (10.6 kg)</text>
		</g>
	</svg>
{:else if id === 'spirit-opportunity-2004'}
	<!-- 11. Opportunity MER-B 45.16 km Meridiani Planum Traverse & Crater Elevation Profile -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Opportunity Rover 45.16 km Meridiani Planum Traverse Elevation Profile">
		<rect width="800" height="225" fill="#050607" />
		<line x1="56" y1="28" x2="56" y2="184" stroke="rgba(232,230,225,0.25)" stroke-width="1.2" />
		<line x1="56" y1="184" x2="768" y2="184" stroke="rgba(232,230,225,0.25)" stroke-width="1.2" />
		{#each [
			{ l: '+40 m', y: 48 },
			{ l: '0 m', y: 108 },
			{ l: '−60 m', y: 168 }
		] as el}
			<line x1="56" y1={el.y} x2="768" y2={el.y} stroke="rgba(232,230,225,0.08)" stroke-dasharray="3 3" />
			<text x="48" y={el.y + 3} text-anchor="end" fill="rgba(232,230,225,0.55)" font-family="monospace" font-size="8">{el.l}</text>
		{/each}
		<!-- Meridiani Planum Topographic & Crater Basin Traverse Profile (0 km -> 45.16 km) -->
		<path
			d="M 68 112 L 92 122 L 108 108 L 152 108 Q 168 148 188 108 L 315 110 Q 345 172 375 106 L 545 104 L 590 62 L 645 48 L 710 78 L 748 128"
			fill="none"
			stroke="#C89B57"
			stroke-width="2.2"
		/>
		{#each [
			{ x: 76, y: 116, l: 'EAGLE CRATER (SOL 1 · 0 km)', sub: 'Hematite "Blueberries"' },
			{ x: 172, y: 132, l: 'ENDURANCE (SOL 134 · 0.8 km)', sub: 'Burns Cliff Sulfate Beds' },
			{ x: 352, y: 148, l: 'VICTORIA CRATER (SOL 951 · 9.5 km)', sub: '800m Impact Basin' },
			{ x: 590, y: 62, l: 'ENDEAVOUR RIM (SOL 2681 · 33.5 km)', sub: '22 km Noachian Rim' },
			{ x: 748, y: 128, l: 'PERSEVERANCE VALLEY (SOL 5111 · 45.16 km)', sub: 'Off-World Driving Record' }
		] as wp, idx}
			<circle cx={wp.x} cy={wp.y} r="4.5" fill={idx === 4 ? '#E8E6E1' : '#C89B57'} />
			<text x={Math.min(610, wp.x - 18)} y={wp.y - 12} fill="#E8E6E1" font-family="monospace" font-size="8">{wp.l}</text>
			<text x={Math.min(610, wp.x - 18)} y={wp.y + 16} fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="7.5">{wp.sub}</text>
		{/each}
		<text x="68" y="24" fill="#C89B57" font-family="monospace" font-size="9">MER-B OPPORTUNITY ODOMETER: 45.16 KM (90-SOL DESIGN → 5,111 SOLS) · SPIRIT MER-A: 7.73 KM AT GUSEV</text>
	</svg>
{:else if id === 'cassini-huygens-2005'}
	<!-- 12. Cassini Saturn Orbit Insertion (F-G Ring Gap) & Huygens Titan Atmospheric Descent Profile -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Cassini SOI Ring-Plane Crossing and Huygens Titan Descent Profile">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: Saturn Ring-Plane SOI Insertion (July 1, 2004, Δv = 626 m/s through F–G Ring Gap) -->
		<g transform="translate(185, 114)">
			<ellipse cx="0" cy="0" rx="145" ry="38" fill="none" stroke="rgba(200,155,87,0.35)" stroke-width="8" />
			<ellipse cx="0" cy="0" rx="112" ry="28" fill="none" stroke="rgba(232,230,225,0.45)" stroke-width="6" />
			<circle cx="0" cy="0" r="42" fill="#0A0B0E" stroke="#C89B57" stroke-width="1.6" />
			<!-- Hyperbolic Approach -> 96-min SOI Main Engine Burn @ 1.33 R_S -->
			<path d="M -155 72 Q -45 -68 125 -52" fill="none" stroke="#E8E6E1" stroke-width="2" />
			<circle cx="-18" cy="-48" r="4.5" fill="#C89B57" />
			<text x="-155" y="-82" fill="#E8E6E1" font-family="monospace" font-size="9">I. CASSINI SOI (1 JUL 2004 · 1.33 R_S)</text>
			<text x="-85" y="-58" fill="#C89B57" font-family="monospace" font-size="8">96m BURN (Δv = 626 m/s) · F–G RING GAP</text>
			<text x="-135" y="92" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8">294 ORBITS · 22 PROXIMAL GRAND FINALE DIVES</text>
		</g>

		<!-- Divider -->
		<line x1="395" y1="20" x2="395" y2="205" stroke="rgba(232,230,225,0.14)" stroke-dasharray="3 3" />

		<!-- Right: Huygens Titan Entry & 2h 27m Parachute Descent Profile (Jan 14, 2005) -->
		<g transform="translate(425, 24)">
			<text x="0" y="10" fill="#C89B57" font-family="monospace" font-size="9">II. HUYGENS TITAN DESCENT (14 JAN 2005 · 1.49 bar N₂/CH₄)</text>
			<line x1="12" y1="168" x2="345" y2="168" stroke="#C89B57" stroke-width="1.5" />
			<path d="M 24 28 Q 95 62 155 96 T 305 168" fill="none" stroke="#E8E6E1" stroke-width="1.8" />
			{#each [
				{ x: 24, y: 28, l: '1,270 km Entry Interface (6.0 km/s)' },
				{ x: 108, y: 68, l: '180 km Pilot & 8.3m Main Chute (Mach 1.5)' },
				{ x: 196, y: 112, l: '125 km Heatshield Release + DISR Panorama' },
				{ x: 305, y: 168, l: '0 km Adiri Touchdown (93.7 K · 4.5 m/s)' }
			] as st, sIdx}
				<circle cx={st.x} cy={st.y} r="3.8" fill={sIdx === 3 ? '#C89B57' : '#E8E6E1'} />
				<text x={Math.min(115, st.x + 8)} y={st.y - 6} fill={sIdx === 3 ? '#C89B57' : '#E8E6E1'} font-family="monospace" font-size="8">{st.l}</text>
			{/each}
		</g>
	</svg>
{:else if id === 'kepler-launch-2009'}
	<!-- 13. Kepler Differential Transit Photometry Light Curve (ΔF = (R_p / R_*)^2) -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Kepler Transit Photometry Light Curve Schematic">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: Star Disk Transit Chord & Impact Parameter b -->
		<g transform="translate(135, 112)">
			<circle cx="0" cy="0" r="58" fill="rgba(200,155,87,0.14)" stroke="#C89B57" stroke-width="1.5" />
			<line x1="-88" y1="14" x2="88" y2="14" stroke="rgba(232,230,225,0.45)" stroke-dasharray="3 3" />
			<!-- Jupiter-size vs Earth-size planet silhouettes -->
			<circle cx="-26" cy="14" r="9" fill="#050607" stroke="#E8E6E1" stroke-width="1.3" />
			<circle cx="24" cy="-16" r="2.5" fill="#050607" stroke="#C89B57" stroke-width="1.2" />
			<line x1="-88" y1="-16" x2="88" y2="-16" stroke="rgba(200,155,87,0.4)" stroke-dasharray="2 2" />
			<text x="-68" y="-68" fill="#E8E6E1" font-family="monospace" font-size="9">STELLAR DISK TRANSIT CHORD</text>
			<text x="-52" y="34" fill="#E8E6E1" font-family="monospace" font-size="7.5">1 R_J (ΔF = 10,000 ppm)</text>
			<text x="-42" y="-24" fill="#C89B57" font-family="monospace" font-size="7.5">1 R_⊕ (ΔF = 84 ppm)</text>
		</g>

		<!-- Right: High-Precision Normalized Flux Light Curve F(t)/F_0 -->
		<g transform="translate(275, 22)">
			<rect x="0" y="12" width="495" height="168" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.16)" />
			<!-- Baseline Flux = 1.00000 -->
			<line x1="20" y1="48" x2="475" y2="48" stroke="rgba(232,230,225,0.28)" stroke-dasharray="3 3" />
			<text x="26" y="40" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8.5">BASELINE FLUX F₀ = 1.00000 (20 ppm CDPP NOISE FLOOR)</text>

			<!-- Hot Jupiter Deep Limb-Darkened Transit Curve (1% = 10,000 ppm) -->
			<path
				d="M 24 48 L 125 48 L 152 132 Q 248 158 344 132 L 372 48 L 470 48"
				fill="none"
				stroke="#E8E6E1"
				stroke-width="1.8"
			/>
			<!-- Earth-Twin Shallow Transit Curve (84 ppm, magnified 4x for clarity) -->
			<path
				d="M 24 48 L 138 48 L 154 78 Q 248 86 342 78 L 358 48 L 470 48"
				fill="none"
				stroke="#C89B57"
				stroke-width="2"
			/>
			<!-- Contact Points T1, T2, T3, T4 -->
			{#each [
				{ x: 125, y: 48, l: 'T₁' },
				{ x: 152, y: 132, l: 'T₂' },
				{ x: 344, y: 132, l: 'T₃' },
				{ x: 372, y: 48, l: 'T₄' }
			] as tp}
				<circle cx={tp.x} cy={tp.y} r="3" fill="#E8E6E1" />
				<text x={tp.x - 5} y={tp.y + 14} fill="rgba(232,230,225,0.7)" font-family="monospace" font-size="8">{tp.l}</text>
			{/each}
			<text x="186" y="96" fill="#C89B57" font-family="monospace" font-size="8.5">EARTH ANALOG: ΔF = (R_p/R_*)² = 84 ppm</text>
			<text x="172" y="162" fill="#E8E6E1" font-family="monospace" font-size="8.5">GAS GIANT: ΔF = 10,000 ppm (1.0% DIP)</text>
			<text x="20" y="194" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">95-MEGAPIXEL CCD FOCAL PLANE · 150,000 STARS MONITORED · 2,778 CONFIRMED PLANETS</text>
		</g>
	</svg>
{:else if id === 'voyager-heliopause-2012'}
	<!-- 14. Voyager 1 Heliopause Crossing (25 Aug 2012 @ 121.6 AU): Solar Wind vs GCR & 2.6 kHz Plasma Wave -->
	<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Voyager 1 Heliopause Crossing Telemetry">
		<rect width="800" height="220" fill="#050607" />
		<line x1="420" y1="20" x2="420" y2="195" stroke="#C89B57" stroke-width="1.5" stroke-dasharray="4 4" />
		<text x="315" y="18" fill="#C89B57" font-family="monospace" font-size="9.5">HELIOPAUSE BOUNDARY: 121.6 AU (25 AUG 2012)</text>
		<path d="M 45 65 L 340 68 L 385 120 L 405 55 L 420 175 L 755 175" fill="none" stroke="rgba(232,230,225,0.45)" stroke-width="1.8" stroke-dasharray="4 3" />
		<text x="55" y="54" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="9">HELIOSPHERIC SOLAR IONS (DROPS 1,000×)</text>
		<path d="M 45 162 L 340 155 L 385 110 L 405 142 L 420 52 L 755 50" fill="none" stroke="#E8E6E1" stroke-width="2" />
		<text x="445" y="42" fill="#E8E6E1" font-family="monospace" font-size="9">GALACTIC COSMIC RAYS + PWS 2.6 kHz (n_e = 0.08 cm⁻³)</text>
	</svg>
{:else if id === 'rosetta-philae-2014'}
	<!-- 15. Rosetta Hyperbolic Pyramid Orbits around 67P/C-G & Philae 3-Touchdown Bounce Trajectory -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Rosetta Pyramid Orbits and Philae Bounce Landing on Comet 67P">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: Rosetta 100 km -> 30 km -> 10 km Triangular Pyramid Capture Orbits around Bilobed 67P -->
		<g transform="translate(175, 116)">
			<polygon points="0,-78 -86,54 86,54" fill="none" stroke="rgba(232,230,225,0.32)" stroke-width="1.2" stroke-dasharray="4 3" />
			<polygon points="0,-52 -56,36 56,36" fill="none" stroke="#C89B57" stroke-width="1.5" />
			<!-- Bilobed 67P/Churyumov-Gerasimenko ("Rubber Duck": 4.1x3.3 km big lobe + 2.6x2.3 km head lobe) -->
			<path
				d="M -26 6 C -28 -14, -6 -18, 4 -6 C 10 -18, 28 -18, 28 -2 C 28 12, 12 16, 4 10 C -4 22, -24 22, -26 6 Z"
				fill="rgba(200,155,87,0.16)"
				stroke="#E8E6E1"
				stroke-width="1.6"
			/>
			<circle cx="0" cy="-52" r="4" fill="#C89B57" />
			<text x="-125" y="-88" fill="#E8E6E1" font-family="monospace" font-size="9">I. ROSETTA PYRAMID CAPTURE ORBITS (AUG 2014)</text>
			<text x="-78" y="74" fill="#C89B57" font-family="monospace" font-size="8">100 km → 30 km → 10 km BOUND ORBIT</text>
			<text x="-78" y="88" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8">67P/C-G: g = 10⁻⁴ m/s² · D/H = 5.3 × 10⁻⁴</text>
		</g>

		<!-- Right: Philae Lander 7-Hour Descent & 3-Touchdown Ballistic Bounce (12 Nov 2014) -->
		<g transform="translate(385, 24)">
			<text x="0" y="12" fill="#C89B57" font-family="monospace" font-size="9">II. PHILAE 3-TOUCHDOWN BOUNCE ON 67P HEAD LOBE (12 NOV 2014)</text>
			<!-- Comet Surface Profile -->
			<path d="M 10 168 Q 165 148 380 172" fill="none" stroke="#E8E6E1" stroke-width="1.6" />
			<!-- Incoming 7-hour ballistic descent from 22.5 km -->
			<line x1="18" y1="36" x2="88" y2="162" stroke="rgba(232,230,225,0.55)" stroke-width="1.4" stroke-dasharray="4 3" />
			<!-- Bounce 1 (1 km high, 1h 50m flight) + Bounce 2 (7m flight) -> Abydos Cliff -->
			<path d="M 88 162 Q 190 22 292 158 Q 318 134 342 166" fill="none" stroke="#C89B57" stroke-width="2" />
			<circle cx="88" cy="162" r="4" fill="#E8E6E1" />
			<text x="34" y="182" fill="#E8E6E1" font-family="monospace" font-size="8">TD1 AGILKIA (15:34 UTC)</text>
			<text x="135" y="54" fill="#C89B57" font-family="monospace" font-size="8">1.0 km APOGEE BOUNCE (v = 38 cm/s)</text>
			<circle cx="292" cy="158" r="3.5" fill="#C89B57" />
			<text x="235" y="182" fill="rgba(232,230,225,0.7)" font-family="monospace" font-size="8">TD2 (17:25 UTC)</text>
			<circle cx="342" cy="166" r="4.5" fill="#C89B57" />
			<text x="285" y="144" fill="#C89B57" font-family="monospace" font-size="8">TD3 ABYDOS (17:32 UTC)</text>
		</g>
	</svg>
{:else if id === 'new-horizons-pluto-2015'}
	<!-- 16. New Horizons Pluto-Charon Flyby Chord & Solar/Earth Occultation Cones -->
	<svg viewBox="0 0 800 220" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="New Horizons Pluto Flyby Trajectory">
		<rect width="800" height="220" fill="#050607" />
		<g transform="translate(260, 110)">
			<circle cx="0" cy="0" r="56" fill="rgba(200,155,87,0.08)" stroke="#C89B57" stroke-width="1.5" />
			<circle cx="0" cy="0" r="68" fill="none" stroke="rgba(232,230,225,0.28)" stroke-dasharray="3 3" />
			<path d="M 4 -8 C 14 -22, 32 -12, 26 8 C 22 22, 6 32, 2 38 C -4 30, -18 20, -16 4 C -14 -12, -2 -18, 4 -8 Z" fill="rgba(232,230,225,0.22)" stroke="#E8E6E1" stroke-width="1" />
			<text x="-48" y="-64" fill="#C89B57" font-family="monospace" font-size="9.5">PLUTO (R = 1,188.3 km)</text>
		</g>
		<g transform="translate(555, 76)">
			<circle cx="0" cy="0" r="28" fill="rgba(232,230,225,0.04)" stroke="rgba(232,230,225,0.55)" stroke-width="1.3" />
			<text x="-32" y="-36" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="9">CHARON (R = 606 km)</text>
		</g>
		<path d="M 30 165 L 760 125" fill="none" stroke="#E8E6E1" stroke-width="1.8" />
		<circle cx="268" cy="152" r="4.5" fill="#C89B57" />
		<text x="190" y="175" fill="#E8E6E1" font-family="monospace" font-size="9">CLOSEST APPROACH: 12,500 KM @ 13.78 KM/S (14 JUL 2015)</text>
		<text x="480" y="165" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">REX + ALICE N₂/CH₄ OCCULTATION SHADOW ZONE →</text>
	</svg>
{:else if id === 'ligo-gravitational-waves-2015'}
	<!-- 17. LIGO GW150914 Strain Chirp Waveform Rising in Frequency (35 Hz -> 250 Hz) & 4km Interferometer -->
	<svg viewBox="0 0 800 230" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="LIGO GW150914 Strain Chirp & Interferometer">
		<rect width="800" height="230" fill="#050607" />
		<g transform="translate(36, 32)">
			<text x="0" y="0" fill="#E8E6E1" font-family="monospace" font-size="9.5">4 KM FABRY–PÉROT ARMS (ΔL = 10⁻¹⁸ m)</text>
			<line x1="56" y1="130" x2="56" y2="20" stroke="#E8E6E1" stroke-width="2" />
			<rect x="46" y="14" width="20" height="6" fill="rgba(232,230,225,0.6)" />
			<line x1="56" y1="130" x2="176" y2="130" stroke="#C89B57" stroke-width="2" />
			<rect x="176" y="120" width="6" height="20" fill="rgba(232,230,225,0.6)" />
			<line x1="46" y1="140" x2="66" y2="120" stroke="#E8E6E1" stroke-width="1.8" />
			<line x1="16" y1="130" x2="56" y2="130" stroke="rgba(232,230,225,0.5)" stroke-width="1.6" />
			<line x1="56" y1="130" x2="56" y2="165" stroke="#C89B57" stroke-width="1.6" />
			<text x="70" y="55" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8">L_x - L_y = h · L</text>
			<text x="12" y="182" fill="#C89B57" font-family="monospace" font-size="8.5">GW150914: 36 M☉ + 29 M☉ → 62 M☉</text>
		</g>
		<g transform="translate(265, 24)">
			<rect x="0" y="10" width="505" height="175" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.16)" />
			<line x1="0" y1="97" x2="505" y2="97" stroke="rgba(232,230,225,0.16)" stroke-dasharray="3 3" />
			{#if ligoDetectorOverlay === 'both' || ligoDetectorOverlay === 'h1'}
				<path
					d="M 14 97 Q 30 82 46 97 T 78 97 T 108 97 Q 122 72 136 97 Q 150 124 164 97 Q 176 66 188 97 Q 200 132 212 97 Q 222 58 232 97 Q 242 142 252 97 Q 260 44 268 97 Q 276 154 284 97 Q 291 28 298 97 Q 305 170 312 97 Q 318 18 324 97 Q 330 176 336 97 Q 341 55 346 97 Q 351 122 356 97 Q 362 88 370 97 L 485 97"
					fill="none"
					stroke="#E8E6E1"
					stroke-width="1.8"
				/>
			{/if}
			{#if ligoDetectorOverlay === 'both' || ligoDetectorOverlay === 'l1'}
				<path
					d="M 22 97 Q 38 84 54 97 T 86 97 T 116 97 Q 130 74 144 97 Q 158 122 172 97 Q 184 68 196 97 Q 208 130 220 97 Q 230 60 240 97 Q 250 140 260 97 Q 268 46 276 97 Q 284 152 292 97 Q 299 30 306 97 Q 313 168 320 97 Q 326 20 332 97 Q 338 174 344 97 Q 349 58 354 97 Q 359 120 364 97 L 485 97"
					fill="none"
					stroke="#C89B57"
					stroke-width="1.6"
				/>
			{/if}
			<text x="16" y="28" fill="#E8E6E1" font-family="monospace" font-size="9">STRAIN h(t) × 10⁻²¹ [PEAK h = 1.0 × 10⁻²¹ @ 250 Hz]</text>
			<text x="45" y="172" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">INSPIRAL (35–150 Hz)</text>
			<text x="275" y="172" fill="#C89B57" font-family="monospace" font-size="8.5">MERGER (3 M☉ c²)</text>
			<text x="395" y="172" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">KERR RINGDOWN</text>
		</g>
	</svg>
{:else if id === 'falcon9-landing-2015'}
	<!-- 18. Falcon 9 Flight 20 Dual-Axis Landing-Burn Velocity (m/s) & Altitude (km) Telemetry Profile -->
	<svg viewBox="0 0 800 230" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Falcon 9 Flight 20 Velocity and Altitude Landing Burn Profile">
		<rect width="800" height="230" fill="#050607" />
		<!-- Left Axis (Altitude 0 to 200 km) & Right Axis (Velocity 0 to 2,000 m/s) -->
		<line x1="64" y1="26" x2="64" y2="188" stroke="rgba(232,230,225,0.28)" stroke-width="1.2" />
		<line x1="726" y1="26" x2="726" y2="188" stroke="rgba(200,155,87,0.32)" stroke-width="1.2" />
		<line x1="64" y1="188" x2="726" y2="188" stroke="rgba(232,230,225,0.28)" stroke-width="1.2" />
		{#each [
			{ alt: '200 km', vel: '2,000 m/s', y: 36 },
			{ alt: '150 km', vel: '1,500 m/s', y: 74 },
			{ alt: '100 km', vel: '1,000 m/s', y: 112 },
			{ alt: '50 km', vel: '500 m/s', y: 150 }
		] as g}
			<line x1="64" y1={g.y} x2="726" y2={g.y} stroke="rgba(232,230,225,0.08)" stroke-dasharray="3 3" />
			<text x="56" y={g.y + 3} text-anchor="end" fill="#E8E6E1" font-family="monospace" font-size="8">{g.alt}</text>
			<text x="734" y={g.y + 3} fill="#C89B57" font-family="monospace" font-size="8">{g.vel}</text>
		{/each}
		<!-- Altitude Profile h(t): Liftoff -> MECO (80km) -> Apogee (200km) -> Entry Burn (70km) -> LZ-1 Touchdown (0km) -->
		<path
			d="M 74 188 Q 160 164 235 127 Q 315 36 390 36 Q 485 36 565 135 Q 635 176 688 188"
			fill="none"
			stroke="#E8E6E1"
			stroke-width="2"
		/>
		<!-- Velocity Profile v(t): Liftoff -> MECO Peak (1,680 m/s) -> Boostback drop -> Freefall accel (1,350 m/s) -> Entry Burn step -> Hoverslam (0 m/s) -->
		<path
			d="M 74 188 Q 165 135 235 60 L 268 122 Q 330 154 390 162 Q 475 120 545 85 L 580 146 Q 630 142 664 158 L 688 188"
			fill="none"
			stroke="#C89B57"
			stroke-width="2"
			stroke-dasharray="5 2"
		/>
		{#each [
			{ x: 235, y: 60, l: 'MECO (T+02:24 · 80 km · 1,680 m/s)', c: '#C89B57' },
			{ x: 390, y: 36, l: 'APOGEE 200 KM (T+04:00)', c: '#E8E6E1' },
			{ x: 545, y: 85, l: '3-ENGINE ENTRY BURN (T+08:16 · 70 km)', c: '#C89B57' },
			{ x: 688, y: 188, l: '1-ENGINE HOVERSLAM @ LZ-1 (T+09:40 · 0 m/s)', c: '#E8E6E1' }
		] as pt}
			<circle cx={pt.x} cy={pt.y} r="4.2" fill={pt.c} />
		{/each}
		<text x="155" y="50" fill="#C89B57" font-family="monospace" font-size="8">MECO + BOOSTBACK (1,680 → 850 m/s)</text>
		<text x="342" y="25" fill="#E8E6E1" font-family="monospace" font-size="8.5">ALTITUDE h(t) — APOGEE 200 KM</text>
		<text x="458" y="76" fill="#C89B57" font-family="monospace" font-size="8">SUPERSONIC RETROPROPULSION (1,350 → 260 m/s)</text>
		<text x="455" y="208" fill="#E8E6E1" font-family="monospace" font-size="8.5">LZ-1 TOUCHDOWN (T+09:40 · B1019 · v = 0 m/s)</text>
		<text x="74" y="208" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8">SOLID: ALTITUDE (KM) · DASHED AMBER: VELOCITY (M/S)</text>
	</svg>
{:else if id === 'hayabusa2-osiris-rex-2018'}
	<!-- 19. Ryugu & Bennu Spinning-Top Rubble-Pile Cross-Sections, SCI Impactor & TAGSAM Nitrogen Head -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Hayabusa2 Ryugu SCI Impactor and OSIRIS-REx Bennu TAGSAM Schematic">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: Hayabusa2 at C-Type Asteroid 162173 Ryugu (D = 896 m) + SCI Copper Explosively Formed Penetrator -->
		<g transform="translate(195, 118)">
			<!-- Equatorial Ridge Spinning-Top Diamond Profile -->
			<polygon
				points="0,-58 64,0 0,58 -64,0"
				fill="rgba(232,230,225,0.04)"
				stroke="#E8E6E1"
				stroke-width="1.6"
			/>
			<!-- Artificial 14.5m SCI Crater & Ejecta Curtain -->
			<path d="M -16 -46 Q 0 -30 16 -46" fill="#050607" stroke="#C89B57" stroke-width="2" />
			<line x1="0" y1="-88" x2="0" y2="-44" stroke="#C89B57" stroke-width="1.6" stroke-dasharray="3 2" />
			<polygon points="-28,-82 0,-42 28,-82" fill="rgba(200,155,87,0.14)" />
			<text x="-145" y="-92" fill="#E8E6E1" font-family="monospace" font-size="9">I. HAYABUSA2 @ 162173 RYUGU (D = 896 m)</text>
			<text x="24" y="-68" fill="#C89B57" font-family="monospace" font-size="8">2 kg Cu SCI IMPACTOR (2 km/s)</text>
			<text x="-110" y="78" fill="#C89B57" font-family="monospace" font-size="8.5">5.4 g RETURNED TO WOOMERA (6 DEC 2020)</text>
		</g>

		<line x1="395" y1="20" x2="395" y2="205" stroke="rgba(232,230,225,0.14)" stroke-dasharray="3 3" />

		<!-- Right: OSIRIS-REx TAGSAM High-Pressure N2 Gas Fluidization Head at Nightingale Crater on Bennu -->
		<g transform="translate(590, 118)">
			<text x="-165" y="-92" fill="#C89B57" font-family="monospace" font-size="9">II. OSIRIS-REx TAGSAM @ 101955 BENNU (D = 490 m)</text>
			<!-- Nightingale Regolith Surface -->
			<path d="M -145 38 Q 0 46 145 38" fill="none" stroke="#E8E6E1" stroke-width="1.6" />
			<!-- TAGSAM Articulated Arm & 30 cm Annular Collector Head -->
			<line x1="0" y1="-68" x2="0" y2="6" stroke="#E8E6E1" stroke-width="3" />
			<rect x="-48" y="6" width="96" height="26" fill="rgba(200,155,87,0.14)" stroke="#C89B57" stroke-width="1.6" />
			<!-- N2 Gas Bottle Injection Arrows & Fluidized Regolith Loop -->
			<path d="M -32 10 L -18 34 L -40 24" fill="none" stroke="#C89B57" stroke-width="1.4" />
			<path d="M 32 10 L 18 34 L 40 24" fill="none" stroke="#C89B57" stroke-width="1.4" />
			<text x="-135" y="-42" fill="#E8E6E1" font-family="monospace" font-size="8">HIGH-PRESSURE N₂ GAS JET FLUIDIZATION</text>
			<text x="-135" y="62" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8">NIGHTINGALE CRATER (48 cm SINK DEPTH)</text>
			<text x="-135" y="78" fill="#C89B57" font-family="monospace" font-size="8.5">121.6 g RETURNED TO UTAH (24 SEP 2023)</text>
		</g>
	</svg>
{:else if id === 'change4-farside-2019'}
	<!-- 20. Chang'e 4 Lunar Far-Side Touchdown & Queqiao Earth–Moon L2 Halo Orbit Relay Geometry -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Chang'e 4 Lunar Far Side and Queqiao Earth-Moon L2 Halo Relay Schematic">
		<rect width="800" height="225" fill="#050607" />
		<!-- Earth (Left) -->
		<circle cx="64" cy="112" r="22" fill="rgba(232,230,225,0.06)" stroke="#E8E6E1" stroke-width="1.6" />
		<text x="38" y="148" fill="#E8E6E1" font-family="monospace" font-size="8.5">EARTH DSN</text>

		<!-- Moon (Center, 384,400 km) Blocking Direct Far-Side Line-of-Sight -->
		<g transform="translate(390, 112)">
			<circle cx="0" cy="0" r="52" fill="#0A0B0E" stroke="#E8E6E1" stroke-width="1.6" />
			<!-- Radio-Shielded Cone behind Lunar Limb -->
			<polygon points="0,-52 165,-86 165,86 0,52" fill="rgba(232,230,225,0.03)" />
			<line x1="0" y1="-58" x2="0" y2="58" stroke="rgba(232,230,225,0.25)" stroke-dasharray="3 3" />
			<text x="-44" y="4" fill="rgba(232,230,225,0.5)" font-family="monospace" font-size="8">NEAR SIDE</text>
			<text x="6" y="4" fill="#C89B57" font-family="monospace" font-size="8">FAR SIDE</text>
			<!-- Von Kármán Crater (45.45°S, 177.6°E) on Far Side Limb -->
			<circle cx="48" cy="20" r="4.5" fill="#C89B57" />
			<text x="-52" y="72" fill="#E8E6E1" font-family="monospace" font-size="8.5">VON KÁRMÁN CRATER (45.5°S, 177.6°E)</text>
			<text x="-52" y="86" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8">2,500 km South Pole–Aitken Basin</text>
		</g>

		<!-- Earth-Moon L2 Point & Queqiao Halo Orbit (65,000 km beyond Moon) -->
		<g transform="translate(655, 112)">
			<ellipse cx="0" cy="0" rx="26" ry="74" fill="none" stroke="#C89B57" stroke-width="1.6" stroke-dasharray="5 3" />
			<circle cx="0" cy="0" r="3" fill="rgba(232,230,225,0.6)" />
			<text x="8" y="4" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8">EM-L2</text>
			<!-- Queqiao Relay Satellite at top of Halo Orbit -->
			<circle cx="-12" cy="-68" r="5" fill="#C89B57" />
			<text x="-85" y="-82" fill="#C89B57" font-family="monospace" font-size="9">QUEQIAO RELAY (4.2m DISH)</text>
		</g>

		<!-- S-Band & X-Band Relay Links (Chang'e 4 <-> Queqiao <-> Earth) -->
		<line x1="438" y1="132" x2="643" y2="44" stroke="#C89B57" stroke-width="1.8" />
		<line x1="643" y1="44" x2="84" y2="102" stroke="#E8E6E1" stroke-width="1.5" stroke-dasharray="5 3" />
		<text x="195" y="56" fill="#E8E6E1" font-family="monospace" font-size="8.5">S-BAND EARTH DOWNLINK (~450,000 KM)</text>
		<text x="485" y="108" fill="#C89B57" font-family="monospace" font-size="8">X-BAND FAR-SIDE LINK (65,000 KM)</text>
	</svg>
{:else if id === 'eht-black-hole-2019'}
	<!-- 21. Event Horizon Telescope 1.3mm VLBI Baseline Network & M87* Relativistic Photon Ring -->
	<svg viewBox="0 0 800 230" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="EHT VLBI Network and M87* Shadow Reconstruction">
		<rect width="800" height="230" fill="#050607" />
		<g transform="translate(155, 115)">
			<circle cx="0" cy="0" r="82" fill="rgba(232,230,225,0.02)" stroke="#E8E6E1" stroke-width="1.3" />
			<ellipse cx="0" cy="0" rx="82" ry="32" fill="none" stroke="rgba(232,230,225,0.16)" />
			<ellipse cx="0" cy="0" rx="36" ry="82" fill="none" stroke="rgba(232,230,225,0.16)" />
			{#each [
				[-52, -18, 12, 34],
				[-52, -18, 0, 76],
				[12, 34, 48, -32],
				[48, -32, 0, 76],
				[-28, -36, 12, 34],
				[-28, -36, 48, -32],
				[-52, -18, -28, -36]
			] as [x1, y1, x2, y2]}
				<line {x1} {y1} {x2} {y2} stroke="#E8E6E1" stroke-width="1.1" stroke-opacity="0.55" />
			{/each}
			{#each [
				{ x: -52, y: -18, l: 'JCMT/SMA' },
				{ x: -28, y: -36, l: 'SMT/LMT' },
				{ x: 12, y: 34, l: 'ALMA/APEX' },
				{ x: 48, y: -32, l: 'IRAM 30m' },
				{ x: 0, y: 76, l: 'SPT' }
			] as st}
				<circle cx={st.x} cy={st.y} r="3.5" fill="#C89B57" />
				<text x={st.x + 6} y={st.y + 3} fill="#E8E6E1" font-family="monospace" font-size="7.5">{st.l}</text>
			{/each}
			<text x="-85" y="-92" fill="#E8E6E1" font-family="monospace" font-size="9">λ = 1.3 mm VLBI (D_eff = 10,700 km)</text>
		</g>
		<g transform="translate(535, 115)">
			<defs>
				<radialGradient id="m87Ring" cx="50%" cy="55%" r="50%">
					<stop offset="0%" stop-color="#050607" />
					<stop offset="44%" stop-color="#050607" />
					<stop offset="65%" stop-color="#C89B57" stop-opacity="0.85" />
					<stop offset="78%" stop-color="#DDB474" stop-opacity="0.95" />
					<stop offset="92%" stop-color="#C89B57" stop-opacity="0.22" />
					<stop offset="100%" stop-color="#050607" stop-opacity="0" />
				</radialGradient>
			</defs>
			<circle cx="0" cy="0" r="84" fill="url(#m87Ring)" />
			<path d="M -46 12 A 48 48 0 0 0 46 12" fill="none" stroke="#E8E6E1" stroke-width="5" stroke-linecap="round" opacity="0.7" />
			<line x1="-52" y1="0" x2="52" y2="0" stroke="rgba(232,230,225,0.55)" stroke-dasharray="3 3" />
			<text x="-38" y="-5" fill="#E8E6E1" font-family="monospace" font-size="8.5">θ = 42 ± 3 μas</text>
			<text x="-110" y="-92" fill="#C89B57" font-family="monospace" font-size="9">M87* (6.5 × 10⁹ M☉ · 55 MILLION LY)</text>
		</g>
	</svg>
{:else if id === 'commercial-crew-demo2-2020'}
	<!-- 22. Crew Dragon Demo-2 Automated RPOD Approach Ellipsoid, Keep-Out Sphere & IDA-2 Docking Corridor -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="SpaceX Crew Dragon Demo-2 Automated ISS Approach Corridor Schematic">
		<rect width="800" height="225" fill="#050607" />
		<!-- Outer 4 km × 2 km Approach Ellipsoid (AE) & Inner 200 m Keep-Out Sphere (KOS) around ISS -->
		<g transform="translate(565, 114)">
			<ellipse cx="0" cy="0" rx="195" ry="86" fill="none" stroke="rgba(232,230,225,0.22)" stroke-width="1.2" stroke-dasharray="5 4" />
			<circle cx="0" cy="0" r="54" fill="rgba(200,155,87,0.05)" stroke="#C89B57" stroke-width="1.3" stroke-dasharray="3 3" />
			<!-- V-Bar Forward Docking Approach Cone to Harmony Node 2 IDA-2 -->
			<polygon points="-155,-26 0,0 -155,26" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="0.9" />
			<!-- ISS Silhouette at Origin -->
			<line x1="-22" y1="-28" x2="22" y2="28" stroke="#E8E6E1" stroke-width="2" />
			<rect x="-12" y="-6" width="24" height="12" fill="#050607" stroke="#E8E6E1" stroke-width="1.5" />
			<circle cx="-12" cy="0" r="3.5" fill="#C89B57" />
			<text x="16" y="-4" fill="#E8E6E1" font-family="monospace" font-size="8.5">ISS HARMONY IDA-2</text>
			<text x="-48" y="-62" fill="#C89B57" font-family="monospace" font-size="8">200m KEEP-OUT SPHERE (KOS)</text>
			<text x="-110" y="-92" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8.5">4 × 2 KM APPROACH ELLIPSOID (AE)</text>
		</g>

		<!-- Crew Dragon Endeavour Phased R-Bar -> V-Bar Automated Trajectory (WP0 -> WP1 -> WP2 -> Soft Capture) -->
		<path d="M 55 186 Q 165 182 285 114 L 445 114 L 553 114" fill="none" stroke="#E8E6E1" stroke-width="2" />
		{#each [
			{ x: 115, y: 180, l: 'WP0 (400m BELOW R-BAR)', c: '#E8E6E1' },
			{ x: 285, y: 114, l: 'WP1 (220m +V-BAR HOLD)', c: '#C89B57' },
			{ x: 445, y: 114, l: 'WP2 (20m LASER LIDAR LOCK)', c: '#C89B57' }
		] as wp}
			<circle cx={wp.x} cy={wp.y} r="4.5" fill={wp.c} />
			<text x={wp.x - 45} y={wp.y - 12} fill={wp.c} font-family="monospace" font-size="8">{wp.l}</text>
		{/each}
		<text x="36" y="34" fill="#E8E6E1" font-family="monospace" font-size="9.5">CREW DRAGON ENDEAVOUR (DEMO-2 · BEHNKEN &amp; HURLEY · 31 MAY 2020)</text>
		<text x="36" y="52" fill="#C89B57" font-family="monospace" font-size="8.5">AUTONOMOUS LIDAR + THERMAL RPOD DOCKING · 8× SUPERDRACO LAUNCH ESCAPE</text>
	</svg>
{:else if id === 'perseverance-ingenuity-2021'}
	<!-- 23. Perseverance TRN Sky Crane Bridle Lowering & Ingenuity Coaxial Rotor Lift in 1% Mars Atmosphere -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Perseverance Sky Crane Maneuver and Ingenuity Coaxial Rotor Aerodynamics">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: Perseverance Sky Crane Descent Stage (21.3m Hover) & 7.6m Nylon Bridles + TRN Hazard Map -->
		<g transform="translate(195, 28)">
			<text x="-155" y="8" fill="#E8E6E1" font-family="monospace" font-size="9">I. SKY CRANE &amp; TRN HAZARD AVOIDANCE (18 FEB 2021)</text>
			<!-- 8-MLE Hydrazine Descent Stage -->
			<rect x="-46" y="28" width="92" height="22" fill="rgba(232,230,225,0.06)" stroke="#E8E6E1" stroke-width="1.5" />
			<!-- Canted MLE Rocket Plumes avoiding Rover -->
			<polygon points="-46,50 -86,115 -58,115" fill="rgba(200,155,87,0.22)" />
			<polygon points="46,50 86,115 58,115" fill="rgba(200,155,87,0.22)" />
			<!-- 3× 7.6m Nylon Bridles + Umbilical -->
			<line x1="-24" y1="50" x2="-18" y2="122" stroke="#C89B57" stroke-width="1.4" />
			<line x1="24" y1="50" x2="18" y2="122" stroke="#C89B57" stroke-width="1.4" />
			<line x1="0" y1="50" x2="0" y2="122" stroke="rgba(232,230,225,0.65)" stroke-dasharray="3 2" />
			<!-- Perseverance Rover (1,025 kg) -->
			<rect x="-32" y="122" width="64" height="24" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="1.6" />
			<circle cx="-24" cy="152" r="6" fill="#050607" stroke="#E8E6E1" stroke-width="1.4" />
			<circle cx="0" cy="152" r="6" fill="#050607" stroke="#E8E6E1" stroke-width="1.4" />
			<circle cx="24" cy="152" r="6" fill="#050607" stroke="#E8E6E1" stroke-width="1.4" />
			<line x1="-155" y1="160" x2="155" y2="160" stroke="#C89B57" stroke-width="1.5" />
			<text x="34" y="88" fill="#C89B57" font-family="monospace" font-size="8">7.6m NYLON BRIDLES (v = 0.75 m/s)</text>
			<text x="-145" y="178" fill="rgba(232,230,225,0.68)" font-family="monospace" font-size="8">JEZERO CRATER DELTA · MOXIE 122 g O₂ PRODUCED</text>
		</g>

		<line x1="400" y1="20" x2="400" y2="205" stroke="rgba(232,230,225,0.14)" stroke-dasharray="3 3" />

		<!-- Right: Ingenuity Mars Helicopter 1.2m Counter-Rotating Carbon-Fiber Coaxial Rotors (2,537 RPM) -->
		<g transform="translate(595, 28)">
			<text x="-165" y="8" fill="#C89B57" font-family="monospace" font-size="9">II. INGENUITY ROTORCRAFT (ρ = 0.015 kg/m³ · 1% EARTH)</text>
			<!-- Solar Panel + Upper/Lower 1.2m Coaxial Rotors -->
			<rect x="-28" y="34" width="56" height="6" fill="#C89B57" />
			<ellipse cx="0" cy="54" rx="115" ry="8" fill="rgba(232,230,225,0.08)" stroke="#E8E6E1" stroke-width="1.5" />
			<ellipse cx="0" cy="70" rx="115" ry="8" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="1.5" />
			<!-- Mast, Tissue-Box Avionics Cube & 4 Carbon-Fiber Legs -->
			<line x1="0" y1="40" x2="0" y2="96" stroke="#E8E6E1" stroke-width="2.2" />
			<rect x="-18" y="96" width="36" height="28" fill="rgba(232,230,225,0.06)" stroke="#E8E6E1" stroke-width="1.5" />
			<line x1="-18" y1="124" x2="-46" y2="156" stroke="#C89B57" stroke-width="1.4" />
			<line x1="18" y1="124" x2="46" y2="156" stroke="#C89B57" stroke-width="1.4" />
			<text x="-145" y="48" fill="#E8E6E1" font-family="monospace" font-size="8">UPPER ROTOR: +2,537 RPM (M_tip ≈ 0.7)</text>
			<text x="-145" y="86" fill="#C89B57" font-family="monospace" font-size="8">LOWER ROTOR: −2,537 RPM · 1.2m SPAN · 1.8 kg</text>
			<text x="-145" y="178" fill="#E8E6E1" font-family="monospace" font-size="8">72 FLIGHTS COMPLETED · 17.0 KM FLOWN (5 DESIGNED)</text>
		</g>
	</svg>
{:else if id === 'jwst-first-images-2022'}
	<!-- 24. JWST 18-Segment Hexagonal Mirror Wing Deployment & 5-Layer L2 Sunshield -->
	<svg viewBox="0 0 800 235" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="JWST 18-Segment Primary Mirror Wing Unfold and L2 Sunshield">
		<rect width="800" height="235" fill="#050607" />
		<!-- Left: 18 Hexagonal Au/Be Segments with Port/Starboard 3-Segment Folding Wings Hinge Axes -->
		<g transform="translate(175, 118)">
			<!-- Wing Hinge Fold Axes (3 segments per side fold back for Ariane 5 5.4m fairing) -->
			<line x1="-42" y1="-76" x2="-42" y2="76" stroke="#E8E6E1" stroke-width="1.1" stroke-dasharray="3 3" />
			<line x1="42" y1="-76" x2="42" y2="76" stroke="#E8E6E1" stroke-width="1.1" stroke-dasharray="3 3" />
			{#each [
				{ x: 0, y: -32, wing: false },
				{ x: 28, y: -16, wing: false },
				{ x: 28, y: 16, wing: false },
				{ x: 0, y: 32, wing: false },
				{ x: -28, y: 16, wing: false },
				{ x: -28, y: -16, wing: false },
				{ x: 0, y: -64, wing: false },
				{ x: 28, y: -48, wing: false },
				{ x: 56, y: -32, wing: true },
				{ x: 56, y: 0, wing: true },
				{ x: 56, y: 32, wing: true },
				{ x: 28, y: 48, wing: false },
				{ x: 0, y: 64, wing: false },
				{ x: -28, y: 48, wing: false },
				{ x: -56, y: 32, wing: true },
				{ x: -56, y: 0, wing: true },
				{ x: -56, y: -32, wing: true },
				{ x: -28, y: -48, wing: false }
			] as seg, idx}
				{@const wingOffset = !jwstPhased && seg.wing ? (seg.x > 0 ? 12 : -12) : 0}
				{@const jitterY = jwstPhased ? 0 : ((idx % 2) - 0.5) * 3}
				<polygon
					points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5"
					transform="translate({seg.x + wingOffset}, {seg.y + jitterY})"
					fill={seg.wing && !jwstPhased ? '#E8E6E1' : '#C89B57'}
					fill-opacity={jwstPhased ? '0.32' : '0.16'}
					stroke={seg.wing && !jwstPhased ? '#E8E6E1' : '#C89B57'}
					stroke-width="1.2"
				/>
			{/each}
			<circle cx="0" cy="0" r="8" fill="#050607" stroke="#E8E6E1" stroke-width="1.4" />
			<text x="-115" y="-92" fill="#C89B57" font-family="monospace" font-size="9">6.5m 18-SEGMENT Au/Be PRIMARY + 2 FOLDING WINGS</text>
			<text x="-95" y="88" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8">126 HEXAPOD ACTUATORS (10 nm STEP)</text>
		</g>

		<!-- Right: 5-Layer Kapton Thermal Gradient & L2 Diffraction Spike PSF -->
		<g transform="translate(370, 32)">
			<text x="0" y="0" fill="#E8E6E1" font-family="monospace" font-size="9.5">5-LAYER KAPTON SUNSHIELD (ΔT = 340 K AT SUN–EARTH L2)</text>
			{#each [0, 1, 2, 3, 4] as layer}
				<path
					d="M 10 {36 + layer * 14} Q 130 {26 + layer * 14} 250 {36 + layer * 14}"
					fill="none"
					stroke={layer < 2 ? '#C89B57' : layer === 2 ? 'rgba(232,230,225,0.55)' : '#E8E6E1'}
					stroke-width="1.6"
				/>
			{/each}
			<text x="12" y="28" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8.5">COLD SIDE: 40 K (−233 °C) // MIRI @ 6.7 K</text>
			<text x="12" y="122" fill="#C89B57" font-family="monospace" font-size="8.5">HOT SUNWARD SIDE: 383 K (+110 °C)</text>
			<g transform="translate(335, 76)">
				{#if jwstPhased}
					{#each [0, 30, 90, 150] as a}
						<line
							x1={Math.cos((a * Math.PI) / 180) * -42}
							y1={Math.sin((a * Math.PI) / 180) * -42}
							x2={Math.cos((a * Math.PI) / 180) * 42}
							y2={Math.sin((a * Math.PI) / 180) * 42}
							stroke="#C89B57"
							stroke-width="1.4"
						/>
					{/each}
					<circle cx="0" cy="0" r="5" fill="#E8E6E1" />
					<text x="-55" y="62" fill="#E8E6E1" font-family="monospace" font-size="8.5">COHERENT WAVEFRONT</text>
				{:else}
					{#each [0, 1, 2, 3, 4, 5] as hexIdx}
						{@const ha = (hexIdx * 60 * Math.PI) / 180}
						<circle cx={Math.cos(ha) * 24} cy={Math.sin(ha) * 24} r="3" fill="#C89B57" />
					{/each}
					<text x="-58" y="62" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8.5">WINGS UNFOLDING</text>
				{/if}
			</g>
		</g>
	</svg>
{:else if id === 'dart-planetary-defense-2022'}
	<!-- 25. DART Kinetic Impact on Dimorphos: Pre/Post Orbit Contraction (ΔT = −33 min 1 s) & β = 3.61 Ejecta Plume -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="DART Didymos-Dimorphos Orbit Period Shift and Momentum Enhancement">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: Didymos–Dimorphos Binary System Pre-Impact vs Post-Impact Orbit -->
		<g transform="translate(215, 114)">
			<!-- Pre-Impact Circular Orbit (a = 1,189 m, T = 11h 55m) -->
			<ellipse cx="0" cy="0" rx="135" ry="74" fill="none" stroke="rgba(232,230,225,0.38)" stroke-width="1.4" stroke-dasharray="5 3" />
			<!-- Post-Impact Contracted Orbit (a = 1,152 m, T = 11h 22m, ΔT = -33m 01s) -->
			<ellipse cx="8" cy="0" rx="118" ry="64" fill="none" stroke="#C89B57" stroke-width="2" />
			<!-- Primary Asteroid 65803 Didymos (D = 780 m) -->
			<circle cx="0" cy="0" r="24" fill="rgba(232,230,225,0.08)" stroke="#E8E6E1" stroke-width="1.6" />
			<text x="-28" y="4" fill="#E8E6E1" font-family="monospace" font-size="8">DIDYMOS</text>
			<!-- Moonlet Dimorphos (D = 151 m) at Impact Point (Right) -->
			<circle cx="126" cy="0" r="8" fill="#17140E" stroke="#C89B57" stroke-width="1.8" />
			<!-- DART 579 kg Spacecraft Head-On Intercept Vector (6.145 km/s) -->
			<line x1="126" y1="68" x2="126" y2="10" stroke="#E8E6E1" stroke-width="2" />
			<!-- Ejecta Plume Recoil Cone (β = 3.61) -->
			<polygon points="126,0 164,54 192,32" fill="rgba(200,155,87,0.24)" stroke="#C89B57" stroke-width="0.9" stroke-dasharray="2 2" />
			<text x="-165" y="-84" fill="#E8E6E1" font-family="monospace" font-size="9">PRE-IMPACT ORBIT: T₀ = 11h 55m (a = 1,189 m)</text>
			<text x="-165" y="88" fill="#C89B57" font-family="monospace" font-size="9">POST-IMPACT ORBIT: T₁ = 11h 22m (ΔT = −33m 01s ± 1s)</text>
		</g>

		<!-- Right: Momentum Enhancement Tensor β = Δp_total / p_DART = 3.61 -->
		<g transform="translate(465, 30)">
			<rect x="0" y="0" width="305" height="164" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.16)" />
			<text x="14" y="22" fill="#C89B57" font-family="monospace" font-size="9">MOMENTUM ENHANCEMENT FACTOR β = 3.61</text>
			<!-- Bar 1: Pure Inelastic Spacecraft Momentum (β = 1.0) -->
			<text x="14" y="54" fill="rgba(232,230,225,0.7)" font-family="monospace" font-size="8">SPACECRAFT MOMENTUM p₀ (579 kg @ 6.14 km/s)</text>
			<rect x="14" y="62" width="72" height="16" fill="rgba(232,230,225,0.28)" stroke="#E8E6E1" stroke-width="1.2" />
			<text x="94" y="74" fill="#E8E6E1" font-family="monospace" font-size="8.5">β = 1.00 (ΔT ≈ −7 min)</text>
			<!-- Bar 2: Observed Total Recoil with 1.6e7 kg Ejecta Plume (β = 3.61) -->
			<text x="14" y="106" fill="#C89B57" font-family="monospace" font-size="8">TOTAL RECOIL WITH 16,000-TONNE EJECTA PLUME</text>
			<rect x="14" y="114" width="260" height="18" fill="rgba(200,155,87,0.22)" stroke="#C89B57" stroke-width="1.5" />
			<text x="14" y="148" fill="#E8E6E1" font-family="monospace" font-size="8.5">β = 3.61 · Δv = −2.70 mm/s · ΔT = −33.0 min</text>
		</g>
	</svg>
{:else if id === 'artemis-lunar-return-2022'}
	<!-- 26. Artemis I 25.5-Day Cislunar Figure-8 & Distant Retrograde Orbit (432,210 km Record) -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Artemis I Distant Retrograde Orbit and Cislunar Trajectory Schematic">
		<rect width="800" height="225" fill="#050607" />
		<!-- Earth (Left) -->
		<circle cx="88" cy="114" r="20" fill="rgba(232,230,225,0.06)" stroke="#E8E6E1" stroke-width="1.6" />
		<text x="64" y="148" fill="#E8E6E1" font-family="monospace" font-size="8.5">EARTH</text>

		<!-- Moon (x = 540, y = 114; 384,400 km) & Distant Retrograde Orbit (DRO, 70,000 km beyond Moon) -->
		<g transform="translate(540, 114)">
			<!-- 70,000 km Distant Retrograde Orbit Loop around Moon -->
			<ellipse cx="0" cy="0" rx="135" ry="74" fill="none" stroke="#C89B57" stroke-width="2" />
			<circle cx="0" cy="0" r="14" fill="#0A0B0E" stroke="#E8E6E1" stroke-width="1.5" />
			<text x="-16" y="28" fill="#E8E6E1" font-family="monospace" font-size="8">MOON</text>
			<!-- Record Apogee Node (432,210 km from Earth on Flight Day 13) -->
			<circle cx="135" cy="0" r="5" fill="#C89B57" />
			<text x="-48" y="-82" fill="#C89B57" font-family="monospace" font-size="9">DISTANT RETROGRADE ORBIT (R_DRO = 70,000 KM)</text>
			<text x="-48" y="88" fill="#E8E6E1" font-family="monospace" font-size="8.5">MAX EARTH RANGE: 432,210 KM (28 NOV 2022)</text>
		</g>

		<!-- Outbound TLI Transfer Curve (Solid) & Return Skip-Entry Curve (Dashed) -->
		<path d="M 108 106 Q 310 38 525 98" fill="none" stroke="#E8E6E1" stroke-width="1.8" />
		<path d="M 525 130 Q 310 188 108 122" fill="none" stroke="rgba(232,230,225,0.55)" stroke-width="1.5" stroke-dasharray="5 3" />
		<text x="195" y="54" fill="#E8E6E1" font-family="monospace" font-size="8.5">SLS 39.1 MN LIFTOFF → OUTBOUND POWERED FLYBY (130 KM)</text>
		<text x="195" y="182" fill="rgba(232,230,225,0.7)" font-family="monospace" font-size="8.5">RETURN FLYBY → 11.0 KM/S (2,760 °C) SKIP-ENTRY SPLASHDOWN</text>
	</svg>
{:else if id === 'exoplanet-census-2026'}
	<!-- 27. Exoplanet Radius–Period Demographic Census (6,400+ Worlds & Fulton Radius Valley at 1.8 R_Earth) -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Exoplanet Radius vs Orbital Period Demographic Distribution">
		<rect width="800" height="225" fill="#050607" />
		<line x1="74" y1="24" x2="74" y2="184" stroke="rgba(232,230,225,0.28)" stroke-width="1.2" />
		<line x1="74" y1="184" x2="756" y2="184" stroke="rgba(232,230,225,0.28)" stroke-width="1.2" />
		{#each [
			{ r: '15 R⊕ (Jupiter)', y: 42 },
			{ r: '4.0 R⊕ (Neptune)', y: 86 },
			{ r: '1.8 R⊕ (Gap)', y: 124 },
			{ r: '1.0 R⊕ (Earth)', y: 158 }
		] as row}
			<line x1="74" y1={row.y} x2="756" y2={row.y} stroke={row.y === 124 ? '#C89B57' : 'rgba(232,230,225,0.08)'} stroke-dasharray="3 3" />
			<text x="66" y={row.y + 3} text-anchor="end" fill={row.y === 124 ? '#C89B57' : 'rgba(232,230,225,0.6)'} font-family="monospace" font-size="7.5">{row.r}</text>
		{/each}
		<!-- Population Clusters: Hot Jupiters, Cold Gas Giants, Sub-Neptunes (2.4 R_E), Super-Earths (1.3 R_E) -->
		<ellipse cx="215" cy="48" rx="68" ry="20" fill="rgba(200,155,87,0.12)" stroke="#C89B57" stroke-width="1.2" />
		<text x="165" y="51" fill="#C89B57" font-family="monospace" font-size="8.5">HOT JUPITERS (51 Peg b)</text>

		<ellipse cx="615" cy="54" rx="95" ry="24" fill="rgba(232,230,225,0.06)" stroke="rgba(232,230,225,0.45)" stroke-width="1.2" />
		<text x="545" y="57" fill="#E8E6E1" font-family="monospace" font-size="8.5">COLD JOVIANS (RV / GAIA)</text>

		<ellipse cx="355" cy="100" rx="135" ry="16" fill="rgba(232,230,225,0.08)" stroke="#E8E6E1" stroke-width="1.4" />
		<text x="265" y="103" fill="#E8E6E1" font-family="monospace" font-size="8.5">SUB-NEPTUNES (2.0–3.5 R⊕ · H₂/H₂O ENVELOPES)</text>

		<ellipse cx="335" cy="148" rx="145" ry="16" fill="rgba(200,155,87,0.16)" stroke="#C89B57" stroke-width="1.5" />
		<text x="225" y="151" fill="#C89B57" font-family="monospace" font-size="8.5">SUPER-EARTHS &amp; ROCKY WORLDS (TRAPPIST-1 b–h)</text>

		<text x="510" y="121" fill="#C89B57" font-family="monospace" font-size="8">← FULTON PHOTOEVAPORATION VALLEY (1.8 R⊕)</text>
		{#each [
			{ x: 135, l: '1 DAY' },
			{ x: 290, l: '10 DAYS' },
			{ x: 465, l: '100 DAYS' },
			{ x: 645, l: '1,000+ DAYS' }
		] as p}
			<text x={p.x} y="202" text-anchor="middle" fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="8">ORBITAL PERIOD: {p.l}</text>
		{/each}
	</svg>
{:else if id === 'ocean-worlds-europa-clipper-2024'}
	<!-- 28. Ocean Worlds Interior Cross-Section (Europa Ice Shell & Subsurface Ocean) + Clipper/JUICE/Dragonfly -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Europa Subsurface Ocean Interior Wedge and Next-Generation Missions">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: Europa Interior Wedge Cross-Section (Ice Shell -> 100 km Liquid Ocean -> Silicate Mantle + Hydrothermal Vents) -->
		<g transform="translate(46, 26)">
			<text x="0" y="8" fill="#E8E6E1" font-family="monospace" font-size="9">I. EUROPA / ENCELADUS OCEAN WORLD INTERIOR CROSS-SECTION</text>
			<!-- Outer Fractured Ice Shell (15–25 km) -->
			<path d="M 35 42 Q 175 16 315 42 L 298 66 Q 175 42 52 66 Z" fill="rgba(232,230,225,0.14)" stroke="#E8E6E1" stroke-width="1.5" />
			<!-- Global Subsurface Saltwater Ocean (60–150 km deep, 2x Earth's oceans) -->
			<path d="M 52 66 Q 175 42 298 66 L 262 128 Q 175 108 88 128 Z" fill="rgba(200,155,87,0.16)" stroke="#C89B57" stroke-width="1.5" />
			<!-- Rocky Silicate Mantle & Seafloor Hydrothermal Plumes -->
			<path d="M 88 128 Q 175 108 262 128 L 222 174 Q 175 164 128 174 Z" fill="rgba(232,230,225,0.05)" stroke="rgba(232,230,225,0.5)" stroke-width="1.2" />
			<!-- Cryovolcanic Plume & Ice-Penetrating Radar (REASON 9/60 MHz) -->
			<line x1="175" y1="12" x2="175" y2="62" stroke="#C89B57" stroke-width="1.4" stroke-dasharray="3 2" />
			<text x="298" y="56" fill="#E8E6E1" font-family="monospace" font-size="8">15–25 km Ice Crust</text>
			<text x="282" y="102" fill="#C89B57" font-family="monospace" font-size="8">100 km Salty Ocean (2× Earth)</text>
			<text x="252" y="152" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8">Tidal-Heated Seafloor Vents</text>
		</g>

		<!-- Right: 2024–2040 Flagship Fleet Matrix (Europa Clipper, ESA JUICE, Dragonfly, LISA, HWO) -->
		<g transform="translate(515, 28)">
			<rect x="0" y="0" width="258" height="168" fill="rgba(232,230,225,0.02)" stroke="rgba(232,230,225,0.16)" />
			<text x="12" y="20" fill="#C89B57" font-family="monospace" font-size="8.5">2024–2040 FLAGSHIP HORIZON FLEET</text>
			{#each [
				{ y: 44, m: 'EUROPA CLIPPER (2024)', d: '49 Flybys (25 km Alt · 30.5m Array)' },
				{ y: 74, m: 'ESA JUICE (2023→2034)', d: 'First Ganymede Orbit Insertion' },
				{ y: 104, m: 'DRAGONFLY (2028→2034)', d: '8-Rotor Nuclear Lander @ Titan' },
				{ y: 134, m: 'LISA + HWO (2035–2040s)', d: '2.5M km GW Laser + 25 Exo-Earths' }
			] as item}
				<circle cx="18" cy={item.y - 3} r="3" fill="#C89B57" />
				<text x="28" y={item.y} fill="#E8E6E1" font-family="monospace" font-size="8">{item.m}</text>
				<text x="28" y={item.y + 12} fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="7.5">{item.d}</text>
			{/each}
		</g>
	</svg>
{:else}
	<!-- 29. Voyager Centennial 2075: Pu-238 MHW-RTG Power Decay Curve & Gliese 445 Interstellar Drift -->
	<svg viewBox="0 0 800 225" class="max-h-[135px] sm:max-h-none w-full h-auto" role="img" aria-label="Voyager Pu-238 RTG Electrical Power Decay and 2075 Centennial Horizon">
		<rect width="800" height="225" fill="#050607" />
		<!-- Left: 3x MHW-RTG Pu-238 Electrical Output Decay (470 W in 1977 -> ~220 W in 2026 -> Threshold ~2032) -->
		<g transform="translate(58, 28)">
			<text x="0" y="6" fill="#E8E6E1" font-family="monospace" font-size="9">I. 3× MHW-RTG Pu-238 POWER DECAY (t½ = 87.7 YR + THERMOCOUPLE LOSS)</text>
			<line x1="0" y1="20" x2="0" y2="162" stroke="rgba(232,230,225,0.28)" stroke-width="1.2" />
			<line x1="0" y1="162" x2="335" y2="162" stroke="rgba(232,230,225,0.28)" stroke-width="1.2" />
			<!-- Minimum Single-Instrument Threshold Line (~200 W) -->
			<line x1="0" y1="112" x2="335" y2="112" stroke="#C89B57" stroke-width="1.1" stroke-dasharray="4 3" />
			<text x="172" y="106" fill="#C89B57" font-family="monospace" font-size="7.5">FINAL INSTRUMENT SHUTOFF (~2032–2036)</text>
			<!-- Exponential Decay Curve P(t) -->
			<path d="M 8 28 Q 110 78 168 102 Q 230 124 325 148" fill="none" stroke="#E8E6E1" stroke-width="2" />
			<circle cx="8" cy="28" r="4" fill="#E8E6E1" />
			<text x="16" y="32" fill="#E8E6E1" font-family="monospace" font-size="8">1977: 470 W</text>
			<circle cx="168" cy="102" r="4.5" fill="#C89B57" />
			<text x="95" y="92" fill="#C89B57" font-family="monospace" font-size="8">2026: ~225 W (−4 W/yr)</text>
			<circle cx="325" cy="148" r="4" fill="rgba(232,230,225,0.6)" />
			<text x="235" y="142" fill="rgba(232,230,225,0.65)" font-family="monospace" font-size="8">2075: SILENT BALLISTIC</text>
		</g>

		<!-- Right: Logarithmic Heliocentric Distance Horizon (172.9 AU Light-Day -> 345 AU Centennial -> Oort Cloud -> Gliese 445) -->
		<g transform="translate(435, 28)">
			<text x="0" y="6" fill="#C89B57" font-family="monospace" font-size="9">II. INTERSTELLAR TRAJECTORY TO GLIESE 445 (v_∞ = 17.0 KM/S)</text>
			<line x1="15" y1="98" x2="335" y2="98" stroke="rgba(232,230,225,0.28)" stroke-width="1.5" />
			{#each [
				{ x: 25, l: '172.9 AU (NOV 2026)', sub: '24h 00m Light-Day' },
				{ x: 125, l: '~345 AU (2075)', sub: 'Centennial Horizon' },
				{ x: 225, l: '300–30,000 YR', sub: 'Oort Cloud Transit' },
				{ x: 300, l: '40,000 YR', sub: 'Gliese 445 (1.7 ly)' }
			] as pt, idx}
				<circle cx={pt.x} cy="98" r="4.5" fill={idx < 2 ? '#C89B57' : '#E8E6E1'} />
				<text x={pt.x - 24} y={idx % 2 === 0 ? 74 : 124} fill={idx < 2 ? '#C89B57' : '#E8E6E1'} font-family="monospace" font-size="8">{pt.l}</text>
				<text x={pt.x - 24} y={idx % 2 === 0 ? 86 : 136} fill="rgba(232,230,225,0.6)" font-family="monospace" font-size="7.5">{pt.sub}</text>
			{/each}
		</g>
	</svg>
{/if}
