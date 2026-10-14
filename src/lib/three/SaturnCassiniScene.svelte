<script lang="ts">
	import { onMount, tick } from 'svelte';
	import * as THREE from 'three';
	import gsap from 'gsap';
	import {
		SATURN_BODY_VERTEX_SHADER,
		SATURN_BODY_FRAGMENT_SHADER,
		SATURN_RINGS_VERTEX_SHADER,
		SATURN_RINGS_FRAGMENT_SHADER,
		TITAN_HAZE_VERTEX_SHADER,
		TITAN_HAZE_FRAGMENT_SHADER,
		SATURN_EQUATORIAL_RADIUS_KM,
		SATURN_OBLATENESS_RATIO,
		RING_INNER_RADIUS_KM,
		RING_OUTER_RADIUS_KM,
		sampleRingProfileAtRadiusKm,
		type RingSampleTelemetry
	} from '$lib/shaders/saturnRings';

	// Scene scale: Saturn Equatorial Radius (60,268 km) = 3.0 scene units
	const SATURN_RADIUS = 3.0;
	const KM_PER_UNIT = SATURN_EQUATORIAL_RADIUS_KM / SATURN_RADIUS; // ~20,089.33 km/unit
	const RING_INNER = RING_INNER_RADIUS_KM / KM_PER_UNIT; // ~3.330
	const RING_OUTER = RING_OUTER_RADIUS_KM / KM_PER_UNIT; // ~6.999

	// Titan & Enceladus local coordinates in Saturn's equatorial frame
	const TITAN_LOCAL_POS = new THREE.Vector3(9.6, 0.18, -9.2);
	const TITAN_RADIUS = 0.66;
	const ENCELADUS_LOCAL_POS = new THREE.Vector3(6.35, 0.0, 5.15);
	const ENCELADUS_RADIUS = 0.22;

	interface CameraPreset {
		id: string;
		indexLabel: string;
		shortLabel: string;
		title: string;
		epoch: string;
		missionPhase: string;
		caption: string;
		targetLocal: [number, number, number];
		orbitRadius: number;
		orbitPolarPhi: number; // radians from +Y (0 = north pole, PI/2 = equator)
		orbitAzimuthTheta: number; // radians in XZ plane
		solarPhaseAngleDeg: number;
		ringTiltDeg: number;
		highlightRadiusKm: number;
		cassiniVelocityKmS: number;
		earthDistanceAu: number;
		oneWayLightTime: string;
		cassiniMode: 'soi' | 'division' | 'titan' | 'enceladus' | 'finale';
	}

	const CAMERA_PRESETS: CameraPreset[] = [
		{
			id: 'soi-crossing',
			indexLabel: '01',
			shortLabel: 'SOI Ring Crossing',
			title: 'SOI Ring-Plane Crossing (July 1, 2004)',
			epoch: '2004-07-01 01:12 UTC',
			missionPhase: '96-MIN MAIN ENGINE ORBIT INSERTION BURN',
			caption:
				'Skimming 19,980 km above the cloud tops after ascending through the F–G ring gap, Cassini fires its 445 N R-4D bipropellant engine for 96 minutes over the sunlit Crepe (C) and B rings.',
			targetLocal: [2.2, 0.05, 1.4],
			orbitRadius: 6.4,
			orbitPolarPhi: 1.24,
			orbitAzimuthTheta: 0.72,
			solarPhaseAngleDeg: 38,
			ringTiltDeg: -16.5,
			highlightRadiusKm: 88500,
			cassiniVelocityKmS: 31.42,
			earthDistanceAu: 9.04,
			oneWayLightTime: '1h 15m 11s',
			cassiniMode: 'soi'
		},
		{
			id: 'cassini-division',
			indexLabel: '02',
			shortLabel: 'Shadow Cone & Division',
			title: 'Cassini Division & Oblate Shadow Cone',
			epoch: '2006-09-15 19:40 UTC',
			missionPhase: 'HIGH-INCLINATION RING MOSAIC',
			caption:
				"High-inclination vantage revealing Saturn's analytical oblate spheroid shadow slicing across the B ring, the 4,800 km Cassini Division (2:1 Mimas resonance), and the 325 km Encke Gap.",
			targetLocal: [0.0, 0.0, 0.0],
			orbitRadius: 14.2,
			orbitPolarPhi: 0.92,
			orbitAzimuthTheta: -0.58,
			solarPhaseAngleDeg: 54,
			ringTiltDeg: -21.4,
			highlightRadiusKm: 119800,
			cassiniVelocityKmS: 17.85,
			earthDistanceAu: 9.18,
			oneWayLightTime: '1h 16m 22s',
			cassiniMode: 'division'
		},
		{
			id: 'huygens-titan',
			indexLabel: '03',
			shortLabel: 'Huygens Titan Descent',
			title: 'Huygens Titan Descent (Jan 14, 2005)',
			epoch: '2005-01-14 09:06 UTC',
			missionPhase: '2H 27M ATMOSPHERIC ENTRY TO XANADU',
			caption:
				"ESA's 318 kg Huygens probe plunges through Titan's nitrogen-methane orange photochemical tholin haze and detached blue-violet aerosol limb, landing on rounded water-ice cobbles at 8.2 AU.",
			targetLocal: [TITAN_LOCAL_POS.x, TITAN_LOCAL_POS.y, TITAN_LOCAL_POS.z],
			orbitRadius: 2.55,
			orbitPolarPhi: 1.38,
			orbitAzimuthTheta: 2.25,
			solarPhaseAngleDeg: 132,
			ringTiltDeg: -14.0,
			highlightRadiusKm: 77870,
			cassiniVelocityKmS: 5.76,
			earthDistanceAu: 8.22,
			oneWayLightTime: '1h 08m 24s',
			cassiniMode: 'titan'
		},
		{
			id: 'enceladus-plumes',
			indexLabel: '04',
			shortLabel: 'Enceladus Cryo-Plumes',
			title: 'Enceladus Cryo-Plume Flyby (2005–2015)',
			epoch: '2015-10-28 15:22 UTC (E-21 Dive)',
			missionPhase: '49 KM SOUTH-POLAR HYDROTHERMAL PLUME PASS',
			caption:
				"Cassini dives 49 km above Enceladus's south polar 'tiger stripe' fractures, sampling supersonic water-vapor, molecular hydrogen (H₂), and silica nanograins venting from a global subsurface ocean.",
			targetLocal: [ENCELADUS_LOCAL_POS.x, ENCELADUS_LOCAL_POS.y - 0.14, ENCELADUS_LOCAL_POS.z],
			orbitRadius: 1.55,
			orbitPolarPhi: 1.62,
			orbitAzimuthTheta: 0.94,
			solarPhaseAngleDeg: 148,
			ringTiltDeg: 8.5,
			highlightRadiusKm: 140180,
			cassiniVelocityKmS: 8.51,
			earthDistanceAu: 9.46,
			oneWayLightTime: '1h 18m 41s',
			cassiniMode: 'enceladus'
		},
		{
			id: 'grand-finale',
			indexLabel: '05',
			shortLabel: 'Grand Finale Plunge',
			title: 'Grand Finale Proximal Plunge (Sept 15, 2017)',
			epoch: '2017-09-15 10:31 UTC (Orbit #294)',
			missionPhase: 'PROXIMAL GAP DIVE & ATMOSPHERIC ENTRY',
			caption:
				"After 22 daring proximal orbits threading the 2,000 km gap between Saturn's upper ammonia clouds and the inner D ring at 34.9 km/s, Cassini enters the atmosphere at 9.4°N to protect Titan and Enceladus.",
			targetLocal: [2.75, 0.32, 1.15],
			orbitRadius: 2.35,
			orbitPolarPhi: 1.18,
			orbitAzimuthTheta: 1.38,
			solarPhaseAngleDeg: 112,
			ringTiltDeg: 26.7,
			highlightRadiusKm: 68200,
			cassiniVelocityKmS: 34.91,
			earthDistanceAu: 9.32,
			oneWayLightTime: '1h 17m 32s',
			cassiniMode: 'finale'
		}
	];

	const RING_ZONE_QUICK_STOPS = [
		{ label: 'D Ring', km: 70500 },
		{ label: 'C Ring', km: 84200 },
		{ label: 'B Core', km: 105400 },
		{ label: 'Cassini Div', km: 119800 },
		{ label: 'A Ring', km: 128500 },
		{ label: 'Encke Gap', km: 133589 },
		{ label: 'Keeler Gap', km: 136505 },
		{ label: 'F Ring', km: 140180 }
	];

	let containerEl: HTMLDivElement | undefined = $state();
	let canvasEl: HTMLCanvasElement | undefined = $state();

	// Reactive UI state
	let activePresetIndex = $state(0);
	let solarPhaseAngleDeg = $state(CAMERA_PRESETS[0].solarPhaseAngleDeg);
	let ringTiltDeg = $state(CAMERA_PRESETS[0].ringTiltDeg);
	let selectedRadiusKm = $state(CAMERA_PRESETS[0].highlightRadiusKm);
	let hoveredRadiusKm = $state<number | null>(null);
	let isPointerDragging = $state(false);
	let isAutoDrifting = $state(true);
	let showTrajectoryOverlay = $state(true);
	let mobileLiteMode = $state(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
	let cleanupSaturnWebGL: (() => void) | null = null;

	let activePreset = $derived(CAMERA_PRESETS[activePresetIndex]);
	let effectiveSampleRadiusKm = $derived(hoveredRadiusKm ?? selectedRadiusKm);
	let ringTelemetry: RingSampleTelemetry = $derived(
		sampleRingProfileAtRadiusKm(effectiveSampleRadiusKm)
	);

	// Derived scattering regime description
	let scatteringRegimeLabel = $derived(
		solarPhaseAngleDeg >= 130
			? 'HIGH-PHASE MIE FORWARD SCATTER (MICRON DUST HALO)'
			: solarPhaseAngleDeg >= 75
				? 'INTERMEDIATE PHASE CROSS-ILLUMINATION'
				: 'LOW-PHASE BACK-SCATTER & OPPOSITION SURGE'
	);

	// Mutable camera controller state animated by GSAP & pointer drag
	const orbitState = {
		targetLocalX: CAMERA_PRESETS[0].targetLocal[0],
		targetLocalY: CAMERA_PRESETS[0].targetLocal[1],
		targetLocalZ: CAMERA_PRESETS[0].targetLocal[2],
		radius: CAMERA_PRESETS[0].orbitRadius,
		phi: CAMERA_PRESETS[0].orbitPolarPhi,
		theta: CAMERA_PRESETS[0].orbitAzimuthTheta,
		solarPhase: CAMERA_PRESETS[0].solarPhaseAngleDeg,
		ringTilt: CAMERA_PRESETS[0].ringTiltDeg
	};

	let activeTween: gsap.core.Tween | null = null;
	let idleResumeTimer: ReturnType<typeof setTimeout> | null = null;

	function applyPreset(index: number) {
		activePresetIndex = index;
		const preset = CAMERA_PRESETS[index];
		selectedRadiusKm = preset.highlightRadiusKm;
		isAutoDrifting = false;

		if (activeTween) {
			activeTween.kill();
		}

		if (mobileLiteMode) {
			orbitState.targetLocalX = preset.targetLocal[0];
			orbitState.targetLocalY = preset.targetLocal[1];
			orbitState.targetLocalZ = preset.targetLocal[2];
			orbitState.radius = preset.orbitRadius;
			orbitState.phi = preset.orbitPolarPhi;
			orbitState.theta = preset.orbitAzimuthTheta;
			orbitState.solarPhase = preset.solarPhaseAngleDeg;
			orbitState.ringTilt = preset.ringTiltDeg;
			solarPhaseAngleDeg = preset.solarPhaseAngleDeg;
			ringTiltDeg = preset.ringTiltDeg;
			return;
		}
		activeTween = gsap.to(orbitState, {
			targetLocalX: preset.targetLocal[0],
			targetLocalY: preset.targetLocal[1],
			targetLocalZ: preset.targetLocal[2],
			radius: preset.orbitRadius,
			phi: preset.orbitPolarPhi,
			theta: preset.orbitAzimuthTheta,
			solarPhase: preset.solarPhaseAngleDeg,
			ringTilt: preset.ringTiltDeg,
			duration: 1.85,
			ease: 'power3.inOut',
			onUpdate: () => {
				solarPhaseAngleDeg = Math.round(orbitState.solarPhase);
				ringTiltDeg = Number(orbitState.ringTilt.toFixed(1));
			},
			onComplete: () => {
				isAutoDrifting = true;
			}
		});
	}

	function handlePhaseSliderInput(e: Event) {
		const val = Number((e.currentTarget as HTMLInputElement).value);
		solarPhaseAngleDeg = val;
		orbitState.solarPhase = val;
	}

	function handleTiltSliderInput(e: Event) {
		const val = Number((e.currentTarget as HTMLInputElement).value);
		ringTiltDeg = val;
		orbitState.ringTilt = val;
	}

	function handleRadiusSliderInput(e: Event) {
		const val = Number((e.currentTarget as HTMLInputElement).value);
		selectedRadiusKm = val;
	}

	function triggerHighPhaseEclipseMosaic() {
		if (activeTween) activeTween.kill();
		activeTween = gsap.to(orbitState, {
			targetLocalX: 0,
			targetLocalY: 0,
			targetLocalZ: 0,
			radius: 13.4,
			phi: 1.32,
			theta: -0.35,
			solarPhase: 168,
			ringTilt: -15.5,
			duration: 1.6,
			ease: 'power3.out',
			onUpdate: () => {
				solarPhaseAngleDeg = Math.round(orbitState.solarPhase);
				ringTiltDeg = Number(orbitState.ringTilt.toFixed(1));
			}
		});
	}

	async function enableInteractiveWebGL() {
		mobileLiteMode = false;
		await tick();
		if (!cleanupSaturnWebGL) {
			cleanupSaturnWebGL = mountSaturnWebGL() ?? null;
		}
	}

	function mountSaturnWebGL(): (() => void) | void {
		if (!canvasEl || !containerEl) return;

		// 1. WebGL Renderer Setup
		let renderer: THREE.WebGLRenderer;
		try {
			renderer = new THREE.WebGLRenderer({
				canvas: canvasEl,
				antialias: true,
				alpha: false,
				powerPreference: 'high-performance'
			});
		} catch {
			mobileLiteMode = true;
			return;
		}
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
		renderer.setClearColor(0x050607, 1);
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.0;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.08, 280);

		// Master Saturn System Group (tilted by Saturn's seasonal obliquity / ringTiltDeg)
		const saturnSystemGroup = new THREE.Group();
		scene.add(saturnSystemGroup);

		// Shared uniforms & archival texture loader
		const sunDirectionWorld = new THREE.Vector3(1, 0.2, 0.5).normalize();
		const ringNormalWorld = new THREE.Vector3(0, 1, 0);
		let isDisposed = false;
		const loadedTextures: THREE.Texture[] = [];
		const fallbackTexture = new THREE.DataTexture(
			new Uint8Array([255, 255, 255, 255]),
			1,
			1,
			THREE.RGBAFormat
		);
		fallbackTexture.needsUpdate = true;
		const textureLoader = new THREE.TextureLoader();
		const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);

		// =========================================================================
		// 2. SATURN OBLATE SPHEROID & ATMOSPHERIC LIMB SHELL
		// =========================================================================
		const saturnGeo = new THREE.SphereGeometry(SATURN_RADIUS, 96, 64);
		const posAttr = saturnGeo.attributes.position;
		for (let i = 0; i < posAttr.count; i++) {
			posAttr.setY(i, posAttr.getY(i) * SATURN_OBLATENESS_RATIO);
		}
		saturnGeo.computeVertexNormals();

		const saturnMat = new THREE.ShaderMaterial({
			vertexShader: SATURN_BODY_VERTEX_SHADER,
			fragmentShader: SATURN_BODY_FRAGMENT_SHADER,
			uniforms: {
				uSunDirection: { value: sunDirectionWorld },
				uTime: { value: 0 },
				uRingTiltRadians: { value: 0 },
				uRingNormal: { value: ringNormalWorld },
				uPlanetRadius: { value: SATURN_RADIUS },
				uRingInnerRadius: { value: RING_INNER },
				uRingOuterRadius: { value: RING_OUTER },
				uSaturnMap: { value: fallbackTexture },
				uHasSaturnMap: { value: 0.0 }
			}
		});
		const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
		saturnSystemGroup.add(saturnMesh);

		// Subtle external Rayleigh/Mie atmospheric glow shell around Saturn
		const saturnAtmoGeo = new THREE.SphereGeometry(SATURN_RADIUS * 1.028, 64, 48);
		const atmoPos = saturnAtmoGeo.attributes.position;
		for (let i = 0; i < atmoPos.count; i++) {
			atmoPos.setY(i, atmoPos.getY(i) * SATURN_OBLATENESS_RATIO);
		}
		saturnAtmoGeo.computeVertexNormals();
		const saturnAtmoMat = new THREE.ShaderMaterial({
			vertexShader: /* glsl */ `
				varying vec3 vWorldNormal;
				varying vec3 vWorldPos;
				void main() {
					vec4 wp = modelMatrix * vec4(position, 1.0);
					vWorldPos = wp.xyz;
					vWorldNormal = normalize(mat3(modelMatrix) * normal);
					gl_Position = projectionMatrix * viewMatrix * wp;
				}
			`,
			fragmentShader: /* glsl */ `
				precision highp float;
				uniform vec3 uSunDirection;
				varying vec3 vWorldNormal;
				varying vec3 vWorldPos;
				void main() {
					vec3 V = normalize(cameraPosition - vWorldPos);
					vec3 N = normalize(vWorldNormal);
					vec3 L = normalize(uSunDirection);
					float rim = smoothstep(0.0, 0.9, 1.0 - abs(dot(N, V))) * pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), 3.2);
					float sunLit = smoothstep(-0.35, 0.45, dot(N, L));
					float forwardBoost = 0.35 + 0.65 * pow(max(dot(V, -L), 0.0), 2.2);
					vec3 col = mix(vec3(0.90, 0.78, 0.54), vec3(0.94, 0.91, 0.84), 0.35 * forwardBoost);
					gl_FragColor = vec4(col * rim * sunLit * forwardBoost * 0.22, rim * 0.20);
				}
			`,
			uniforms: {
				uSunDirection: { value: sunDirectionWorld }
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			side: THREE.BackSide,
			depthWrite: false
		});
		const saturnAtmoMesh = new THREE.Mesh(saturnAtmoGeo, saturnAtmoMat);
		saturnSystemGroup.add(saturnAtmoMesh);

		// =========================================================================
		// 3. SATURN EXPANSIVE RING SYSTEM (D, C, B, CASSINI DIV, A, ENCKE, KEELER, F)
		// =========================================================================
		const ringGeo = new THREE.RingGeometry(RING_INNER, RING_OUTER, 256, 48);
		ringGeo.rotateX(-Math.PI / 2); // Align directly with Saturn's equatorial XZ plane

		const ringMat = new THREE.ShaderMaterial({
			vertexShader: SATURN_RINGS_VERTEX_SHADER,
			fragmentShader: SATURN_RINGS_FRAGMENT_SHADER,
			uniforms: {
				uSunDirection: { value: sunDirectionWorld },
				uTime: { value: 0 },
				uInnerRadius: { value: RING_INNER },
				uOuterRadius: { value: RING_OUTER },
				uPlanetEquatorialRadius: { value: SATURN_RADIUS },
				uPlanetOblatenessRatio: { value: SATURN_OBLATENESS_RATIO },
				uRingNormal: { value: ringNormalWorld },
				uHighlightRadiusKm: { value: selectedRadiusKm },
				uRingTex: { value: fallbackTexture },
				uHasRingTex: { value: 0.0 }
			},
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false
		});
		const ringMesh = new THREE.Mesh(ringGeo, ringMat);
		ringMesh.renderOrder = 2;
		saturnSystemGroup.add(ringMesh);

		// =========================================================================
		// 4. TITAN WITH ORANGE PHOTOCHEMICAL HAZE & HUYGENS PROBE DESCENT BEACON
		// =========================================================================
		const titanGroup = new THREE.Group();
		titanGroup.position.copy(TITAN_LOCAL_POS);
		saturnSystemGroup.add(titanGroup);

		const titanGeo = new THREE.SphereGeometry(TITAN_RADIUS, 64, 48);
		const titanMat = new THREE.ShaderMaterial({
			vertexShader: TITAN_HAZE_VERTEX_SHADER,
			fragmentShader: TITAN_HAZE_FRAGMENT_SHADER,
			uniforms: {
				uSunDirection: { value: sunDirectionWorld },
				uTime: { value: 0 },
				uTitanMap: { value: fallbackTexture },
				uHasTitanMap: { value: 0.0 }
			}
		});
		const titanMesh = new THREE.Mesh(titanGeo, titanMat);
		titanGroup.add(titanMesh);

		// Detached high-altitude blue/violet aerosol layer shell around Titan
		const titanDetachedGeo = new THREE.SphereGeometry(TITAN_RADIUS * 1.062, 48, 36);
		const titanDetachedMat = new THREE.ShaderMaterial({
			vertexShader: /* glsl */ `
				varying vec3 vWorldNormal;
				varying vec3 vWorldPos;
				void main() {
					vec4 wp = modelMatrix * vec4(position, 1.0);
					vWorldPos = wp.xyz;
					vWorldNormal = normalize(mat3(modelMatrix) * normal);
					gl_Position = projectionMatrix * viewMatrix * wp;
				}
			`,
			fragmentShader: /* glsl */ `
				precision highp float;
				uniform vec3 uSunDirection;
				varying vec3 vWorldNormal;
				varying vec3 vWorldPos;
				void main() {
					vec3 V = normalize(cameraPosition - vWorldPos);
					vec3 N = normalize(vWorldNormal);
					vec3 L = normalize(uSunDirection);
					float rim = pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), 2.8);
					float sunFactor = smoothstep(-0.45, 0.35, dot(N, L));
					float forwardScatter = 0.45 + 0.85 * pow(max(dot(V, -L), 0.0), 2.0);
					vec3 col = mix(vec3(0.86, 0.58, 0.26), vec3(0.76, 0.74, 0.70), 0.45);
					gl_FragColor = vec4(col * rim * sunFactor * forwardScatter * 0.38, rim * 0.34);
				}
			`,
			uniforms: {
				uSunDirection: { value: sunDirectionWorld }
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			side: THREE.BackSide,
			depthWrite: false
		});
		const titanDetachedMesh = new THREE.Mesh(titanDetachedGeo, titanDetachedMat);
		titanGroup.add(titanDetachedMesh);

		// Huygens Probe Atmospheric Entry & Descent Trajectory Curve to Xanadu/Adiri
		const huygensCurvePoints = [
			new THREE.Vector3(-1.45, 0.92, 1.35),
			new THREE.Vector3(-1.05, 0.62, 0.98),
			new THREE.Vector3(-0.74, 0.34, 0.68),
			new THREE.Vector3(-0.56, 0.12, 0.51),
			new THREE.Vector3(-0.48, -0.08, 0.44),
			new THREE.Vector3(-0.44, -0.14, 0.47) // Adiri landing site on Titan's surface (r ~ 0.66)
		];
		const huygensCurve = new THREE.CatmullRomCurve3(huygensCurvePoints);
		const huygensPathGeo = new THREE.BufferGeometry().setFromPoints(huygensCurve.getPoints(64));
		const huygensPathMat = new THREE.LineBasicMaterial({
			color: 0xc89b57,
			transparent: true,
			opacity: 0.82
		});
		const huygensPathLine = new THREE.Line(huygensPathGeo, huygensPathMat);
		titanGroup.add(huygensPathLine);

		// Animated Huygens Descent Aeroshell Beacon & Landing Telemetry Ring
		const huygensBeaconGroup = new THREE.Group();
		const huygensShieldGeo = new THREE.ConeGeometry(0.036, 0.024, 16);
		huygensShieldGeo.rotateX(Math.PI);
		const huygensShieldMat = new THREE.MeshBasicMaterial({ color: 0xddb474 });
		const huygensShieldMesh = new THREE.Mesh(huygensShieldGeo, huygensShieldMat);
		huygensBeaconGroup.add(huygensShieldMesh);

		const huygensPulseRingGeo = new THREE.RingGeometry(0.035, 0.055, 24);
		const huygensPulseRingMat = new THREE.MeshBasicMaterial({
			color: 0xe8e6e1,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.65,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		const huygensPulseRing = new THREE.Mesh(huygensPulseRingGeo, huygensPulseRingMat);
		huygensBeaconGroup.add(huygensPulseRing);
		titanGroup.add(huygensBeaconGroup);

		// =========================================================================
		// 5. ENCELADUS & SOUTH-POLAR CRYO-PLUME GEYSER PARTICLE JETS
		// =========================================================================
		const enceladusGroup = new THREE.Group();
		enceladusGroup.position.copy(ENCELADUS_LOCAL_POS);
		saturnSystemGroup.add(enceladusGroup);

		const enceladusGeo = new THREE.SphereGeometry(ENCELADUS_RADIUS, 48, 36);
		const enceladusMat = new THREE.ShaderMaterial({
			vertexShader: /* glsl */ `
				varying vec3 vLocalPos;
				varying vec3 vWorldNormal;
				varying vec3 vWorldPos;
				void main() {
					vLocalPos = position;
					vec4 wp = modelMatrix * vec4(position, 1.0);
					vWorldPos = wp.xyz;
					vWorldNormal = normalize(mat3(modelMatrix) * normal);
					gl_Position = projectionMatrix * viewMatrix * wp;
				}
			`,
			fragmentShader: /* glsl */ `
				precision highp float;
				uniform vec3 uSunDirection;
				uniform sampler2D uEnceladusMap;
				uniform float uHasEnceladusMap;
				varying vec3 vLocalPos;
				varying vec3 vWorldNormal;
				varying vec3 vWorldPos;
				void main() {
					vec3 N = normalize(vWorldNormal);
					vec3 L = normalize(uSunDirection);
					vec3 V = normalize(cameraPosition - vWorldPos);
					vec3 p = normalize(vLocalPos);

					// High-albedo crystalline water ice + south polar "Tiger Stripes" (Baghdad, Cairo, Damascus, Alexandria sulci)
					float ridges = sin(p.x * 28.0 + sin(p.z * 19.0)) * 0.5 + 0.5;
					vec3 iceColor = mix(vec3(0.84, 0.83, 0.80), vec3(0.95, 0.94, 0.92), ridges * 0.65);

					if (uHasEnceladusMap > 0.5) {
						float lat = asin(clamp(p.y, -1.0, 1.0));
						float lon = atan(p.z, p.x);
						vec2 encUv = vec2(fract(lon / 6.2831853 + 0.5), lat / 3.14159265 + 0.5);
						vec3 encTex = texture2D(uEnceladusMap, encUv).rgb;
						iceColor = mix(iceColor, encTex * vec3(1.02, 1.01, 0.98), 0.72);
					}

					// South polar tiger stripe thermal fractures (p.y < -0.78)
					float southPoleMask = smoothstep(-0.72, -0.92, p.y);
					float stripePattern = exp(-pow(sin(p.x * 46.0 + p.z * 12.0), 2.0) * 18.0);
					vec3 tigerGlow = vec3(0.784, 0.608, 0.341) * southPoleMask * stripePattern * 0.55;

					float diff = smoothstep(-0.18, 0.85, dot(N, L));
					float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6) * 0.18;
					vec3 col = iceColor * (0.12 + 0.88 * diff) + tigerGlow + vec3(0.91, 0.90, 0.88) * rim;
					gl_FragColor = vec4(col, 1.0);
				}
			`,
			uniforms: {
				uSunDirection: { value: sunDirectionWorld },
				uEnceladusMap: { value: fallbackTexture },
				uHasEnceladusMap: { value: 0.0 }
			}
		});
		const enceladusMesh = new THREE.Mesh(enceladusGeo, enceladusMat);
		enceladusGroup.add(enceladusMesh);

		// Load real Cassini archival planetary & ring textures from /assets/textures/*.webp
		textureLoader.load('/assets/textures/saturn-map.webp', (tex) => {
			if (isDisposed) {
				tex.dispose();
				return;
			}
			tex.wrapS = THREE.RepeatWrapping;
			tex.wrapT = THREE.ClampToEdgeWrapping;
			tex.anisotropy = maxAnisotropy;
			tex.needsUpdate = true;
			loadedTextures.push(tex);
			saturnMat.uniforms.uSaturnMap.value = tex;
			saturnMat.uniforms.uHasSaturnMap.value = 1.0;
		});

		textureLoader.load('/assets/textures/saturn-rings.webp', (tex) => {
			if (isDisposed) {
				tex.dispose();
				return;
			}
			tex.wrapS = THREE.ClampToEdgeWrapping;
			tex.wrapT = THREE.ClampToEdgeWrapping;
			tex.anisotropy = maxAnisotropy;
			tex.needsUpdate = true;
			loadedTextures.push(tex);
			ringMat.uniforms.uRingTex.value = tex;
			ringMat.uniforms.uHasRingTex.value = 1.0;
		});

		textureLoader.load('/assets/textures/titan-map.webp', (tex) => {
			if (isDisposed) {
				tex.dispose();
				return;
			}
			tex.wrapS = THREE.RepeatWrapping;
			tex.wrapT = THREE.ClampToEdgeWrapping;
			tex.anisotropy = maxAnisotropy;
			tex.needsUpdate = true;
			loadedTextures.push(tex);
			titanMat.uniforms.uTitanMap.value = tex;
			titanMat.uniforms.uHasTitanMap.value = 1.0;
		});

		textureLoader.load('/assets/textures/enceladus-map.webp', (tex) => {
			if (isDisposed) {
				tex.dispose();
				return;
			}
			tex.wrapS = THREE.RepeatWrapping;
			tex.wrapT = THREE.ClampToEdgeWrapping;
			tex.anisotropy = maxAnisotropy;
			tex.needsUpdate = true;
			loadedTextures.push(tex);
			enceladusMat.uniforms.uEnceladusMap.value = tex;
			enceladusMat.uniforms.uHasEnceladusMap.value = 1.0;
		});

		// South-polar cryo-plume particle system (420 supersonic water-ice particles)
		const PLUME_COUNT = 420;
		const plumePositions = new Float32Array(PLUME_COUNT * 3);
		const plumeVelocities = new Float32Array(PLUME_COUNT * 3);
		const plumePhases = new Float32Array(PLUME_COUNT);

		// 4 distinct tiger-stripe vent origins at Enceladus's south pole
		const ventOffsets = [
			[-0.04, -ENCELADUS_RADIUS * 0.96, -0.02],
			[0.03, -ENCELADUS_RADIUS * 0.97, -0.03],
			[-0.01, -ENCELADUS_RADIUS * 0.98, 0.04],
			[0.04, -ENCELADUS_RADIUS * 0.95, 0.02]
		];

		for (let i = 0; i < PLUME_COUNT; i++) {
			const vent = ventOffsets[i % 4];
			plumePhases[i] = Math.random();
			const spreadAngle = Math.random() * Math.PI * 2;
			const spreadRadius = Math.random() * 0.16;
			plumeVelocities[i * 3 + 0] = Math.cos(spreadAngle) * spreadRadius + vent[0] * 1.4;
			plumeVelocities[i * 3 + 1] = -(0.55 + Math.random() * 0.65); // Erupting southward (-Y)
			plumeVelocities[i * 3 + 2] = Math.sin(spreadAngle) * spreadRadius + vent[2] * 1.4;
		}

		const plumeGeo = new THREE.BufferGeometry();
		plumeGeo.setAttribute('position', new THREE.BufferAttribute(plumePositions, 3));
		plumeGeo.setAttribute('aPhase', new THREE.BufferAttribute(plumePhases, 1));

		const plumeMat = new THREE.ShaderMaterial({
			vertexShader: /* glsl */ `
				attribute float aPhase;
				varying float vLife;
				void main() {
					vLife = aPhase;
					vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
					gl_PointSize = clamp((1.0 - aPhase * 0.55) * (48.0 / max(-mvPos.z, 0.3)), 1.5, 16.0);
					gl_Position = projectionMatrix * mvPos;
				}
			`,
			fragmentShader: /* glsl */ `
				precision highp float;
				varying float vLife;
				void main() {
					vec2 uv = gl_PointCoord - 0.5;
					float d = length(uv);
					if (d > 0.5) discard;
					float soft = exp(-d * d * 14.0);
					float alpha = soft * sin(vLife * 3.14159) * 0.68;
					vec3 col = mix(vec3(0.92, 0.91, 0.89), vec3(0.78, 0.76, 0.72), vLife);
					gl_FragColor = vec4(col, alpha);
				}
			`,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		const plumePoints = new THREE.Points(plumeGeo, plumeMat);
		enceladusGroup.add(plumePoints);

		// =========================================================================
		// 6. PROCEDURAL 3D CASSINI–HUYGENS SPACECRAFT & ORBITAL TRAJECTORY ARCS
		// =========================================================================
		const cassiniGroup = new THREE.Group();
		saturnSystemGroup.add(cassiniGroup);

		// Build procedural Cassini spacecraft model
		const craftVisual = new THREE.Group();
		craftVisual.scale.setScalar(0.055);
		cassiniGroup.add(craftVisual);

		// 6a. 4-meter High-Gain Antenna (HGA) white parabolic dish + feed tripod
		const dishGeo = new THREE.CylinderGeometry(1.1, 0.22, 0.34, 28, 1, true);
		const dishMat = new THREE.MeshBasicMaterial({
			color: 0xf1f5f9,
			side: THREE.DoubleSide
		});
		const dishMesh = new THREE.Mesh(dishGeo, dishMat);
		dishMesh.position.y = 0.85;
		craftVisual.add(dishMesh);

		const feedRodGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8);
		const silverMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
		const feedRod = new THREE.Mesh(feedRodGeo, silverMat);
		feedRod.position.y = 1.2;
		craftVisual.add(feedRod);

		// 6b. 12-sided Spacecraft Bus wrapped in Gold Kapton MLI Blankets
		const busGeo = new THREE.CylinderGeometry(0.48, 0.54, 1.35, 12);
		const goldKaptonMat = new THREE.MeshBasicMaterial({ color: 0xc89b57 });
		const busMesh = new THREE.Mesh(busGeo, goldKaptonMat);
		busMesh.position.y = 0.05;
		craftVisual.add(busMesh);

		// 6c. 11-meter Magnetometer Boom extending along +X
		const magBoomGeo = new THREE.CylinderGeometry(0.025, 0.018, 3.4, 8);
		magBoomGeo.rotateZ(Math.PI / 2);
		const magBoomMat = new THREE.MeshBasicMaterial({ color: 0xd6d3cb });
		const magBoom = new THREE.Mesh(magBoomGeo, magBoomMat);
		magBoom.position.set(1.9, 0.25, 0);
		craftVisual.add(magBoom);

		// 6d. Three RTG Nuclear Power Booms
		for (let r = 0; r < 3; r++) {
			const rtgAngle = (r * Math.PI * 2) / 3 + 0.4;
			const rtgGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.65, 10);
			rtgGeo.rotateZ(Math.PI / 2.4);
			const rtgMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
			const rtgMesh = new THREE.Mesh(rtgGeo, rtgMat);
			rtgMesh.position.set(Math.cos(rtgAngle) * 0.68, -0.35, Math.sin(rtgAngle) * 0.68);
			rtgMesh.rotation.y = -rtgAngle;
			craftVisual.add(rtgMesh);
		}

		// 6e. Twin R-4D Main Engine Nozzles + SOI Burn Glow
		const engineGlowGeo = new THREE.ConeGeometry(0.28, 0.95, 16);
		engineGlowGeo.rotateX(Math.PI);
		const engineGlowMat = new THREE.MeshBasicMaterial({
			color: 0xddb474,
			transparent: true,
			opacity: 0.75,
			blending: THREE.AdditiveBlending,
			depthWrite: false
		});
		const engineGlowMesh = new THREE.Mesh(engineGlowGeo, engineGlowMat);
		engineGlowMesh.position.y = -1.05;
		craftVisual.add(engineGlowMesh);

		// Telemetry beacon sprite ring around Cassini
		const cassiniBeaconGeo = new THREE.RingGeometry(0.045, 0.06, 32);
		const cassiniBeaconMat = new THREE.MeshBasicMaterial({
			color: 0xc89b57,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.35,
			depthWrite: false
		});
		const cassiniBeacon = new THREE.Mesh(cassiniBeaconGeo, cassiniBeaconMat);
		cassiniGroup.add(cassiniBeacon);

		// 6f. Mission Trajectory Curves
		const trajectoryGroup = new THREE.Group();
		saturnSystemGroup.add(trajectoryGroup);

		// Trajectory 1: July 1, 2004 Saturn Orbit Insertion (SOI) Hyperbolic Capture Arc
		const soiCurve = new THREE.CatmullRomCurve3([
			new THREE.Vector3(8.5, -1.8, 6.2),
			new THREE.Vector3(6.4, -0.3, 4.1), // Ascending ring plane crossing between F and G rings
			new THREE.Vector3(4.1, 0.52, 2.3), // Skimming over C/B rings during 96-min SOI burn
			new THREE.Vector3(1.6, 0.68, 3.4), // Closest approach (19,980 km above clouds)
			new THREE.Vector3(-2.4, 0.35, 4.6),
			new THREE.Vector3(-5.8, -0.45, 3.2), // Descending ring plane crossing
			new THREE.Vector3(-8.4, -1.3, -1.2)
		]);
		const soiGeo = new THREE.BufferGeometry().setFromPoints(soiCurve.getPoints(120));
		const soiMat = new THREE.LineBasicMaterial({
			color: 0xc89b57,
			transparent: true,
			opacity: 0.72
		});
		const soiLine = new THREE.Line(soiGeo, soiMat);
		trajectoryGroup.add(soiLine);

		// Trajectory 2: Sept 15, 2017 Grand Finale Proximal Plunge Arc (threading the 2,000 km D-ring gap!)
		const finaleCurve = new THREE.CatmullRomCurve3([
			new THREE.Vector3(1.4, 5.2, -3.1),
			new THREE.Vector3(2.55, 2.4, -0.6),
			new THREE.Vector3(3.14, 0.15, 0.45), // Diving through the 2,000 km gap (Saturn R=3.0, D-ring=3.33)!
			new THREE.Vector3(2.85, -1.65, 1.55),
			new THREE.Vector3(2.62, 0.48, 1.08) // Final atmospheric entry at 9.4°N
		]);
		const finaleGeo = new THREE.BufferGeometry().setFromPoints(finaleCurve.getPoints(100));
		const finaleMat = new THREE.LineBasicMaterial({
			color: 0xe8e6e1,
			transparent: true,
			opacity: 0.55
		});
		const finaleLine = new THREE.Line(finaleGeo, finaleMat);
		trajectoryGroup.add(finaleLine);

		// =========================================================================
		// 7. DEEP-SPACE BACKGROUND STARFIELD
		// =========================================================================
		const STAR_COUNT = 1600;
		const starPositions = new Float32Array(STAR_COUNT * 3);
		const starColors = new Float32Array(STAR_COUNT * 3);
		const palette = [
			new THREE.Color('#e8e6e1'),
			new THREE.Color('#f3efe6'),
			new THREE.Color('#ddb474'),
			new THREE.Color('#c89b57'),
			new THREE.Color('#b8b4ac')
		];

		for (let i = 0; i < STAR_COUNT; i++) {
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI;
			const phi = Math.acos(2.0 * v - 1.0);
			const r = 95 + Math.random() * 65;

			starPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
			starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
			starPositions[i * 3 + 2] = r * Math.cos(phi);

			const c = palette[i % palette.length];
			const brightness = 0.45 + Math.random() * 0.55;
			starColors[i * 3 + 0] = c.r * brightness;
			starColors[i * 3 + 1] = c.g * brightness;
			starColors[i * 3 + 2] = c.b * brightness;
		}

		const starGeo = new THREE.BufferGeometry();
		starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
		starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
		const starMat = new THREE.PointsMaterial({
			size: 0.38,
			vertexColors: true,
			transparent: true,
			opacity: 0.85,
			depthWrite: false
		});
		const starField = new THREE.Points(starGeo, starMat);
		scene.add(starField);

		// =========================================================================
		// 8. INTERACTIVE POINTER ORBIT, ZOOM & RING RADIAL RAYCASTING
		// =========================================================================
		const raycaster = new THREE.Raycaster();
		const pointerNdc = new THREE.Vector2();
		let pointerDownX = 0;
		let pointerDownY = 0;

		function pauseAutoDriftTemporarily() {
			isAutoDrifting = false;
			if (idleResumeTimer) clearTimeout(idleResumeTimer);
			idleResumeTimer = setTimeout(() => {
				isAutoDrifting = true;
			}, 4500);
		}

		function onPointerDown(e: PointerEvent) {
			if (e.button !== 0 && e.pointerType === 'mouse') return;
			isPointerDragging = true;
			pointerDownX = e.clientX;
			pointerDownY = e.clientY;
			if (activeTween) activeTween.kill();
			pauseAutoDriftTemporarily();
			canvasEl?.setPointerCapture(e.pointerId);
		}

		function onPointerMove(e: PointerEvent) {
			if (!canvasEl) return;
			const rect = canvasEl.getBoundingClientRect();

			if (isPointerDragging) {
				const dx = e.clientX - pointerDownX;
				const dy = e.clientY - pointerDownY;
				pointerDownX = e.clientX;
				pointerDownY = e.clientY;

				orbitState.theta -= dx * 0.0065;
				orbitState.phi = Math.max(0.18, Math.min(Math.PI - 0.18, orbitState.phi - dy * 0.0055));
				pauseAutoDriftTemporarily();
				return;
			}

			// Raycast against the ring mesh to provide live radial optical depth inspection on hover
			pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			raycaster.setFromCamera(pointerNdc, camera);
			const hits = raycaster.intersectObject(ringMesh, false);
			if (hits.length > 0) {
				const localHit = ringMesh.worldToLocal(hits[0].point.clone());
				const rScene = Math.hypot(localHit.x, localHit.z);
				const rKm = Math.round(rScene * KM_PER_UNIT);
				if (rKm >= RING_INNER_RADIUS_KM && rKm <= RING_OUTER_RADIUS_KM) {
					hoveredRadiusKm = rKm;
				} else {
					hoveredRadiusKm = null;
				}
			} else {
				hoveredRadiusKm = null;
			}
		}

		function onPointerUp(e: PointerEvent) {
			if (!isPointerDragging) return;
			isPointerDragging = false;
			if (canvasEl?.hasPointerCapture(e.pointerId)) {
				canvasEl.releasePointerCapture(e.pointerId);
			}
		}

		function onWheel(e: WheelEvent) {
			e.preventDefault();
			if (activeTween) activeTween.kill();
			orbitState.radius = Math.max(1.25, Math.min(24.0, orbitState.radius + e.deltaY * 0.006));
			pauseAutoDriftTemporarily();
		}

		canvasEl.addEventListener('pointerdown', onPointerDown);
		canvasEl.addEventListener('pointermove', onPointerMove);
		canvasEl.addEventListener('pointerup', onPointerUp);
		canvasEl.addEventListener('pointerleave', () => {
			hoveredRadiusKm = null;
		});
		canvasEl.addEventListener('wheel', onWheel, { passive: false });

		// =========================================================================
		// 9. RESIZE & INTERSECTION OBSERVER (PAUSE WHEN OFF-SCREEN)
		// =========================================================================
		function updateViewportSize() {
			if (!containerEl) return;
			const w = Math.max(containerEl.clientWidth, 300);
			const h = Math.max(containerEl.clientHeight, 420);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h, false);
		}
		updateViewportSize();

		const resizeObserver = new ResizeObserver(() => {
			updateViewportSize();
		});
		resizeObserver.observe(containerEl);

		let isVisibleInViewport = true;
		let rafId = 0;

		const intersectionObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					isVisibleInViewport = entry.isIntersecting;
				}
			},
			{ threshold: 0.05 }
		);
		intersectionObserver.observe(containerEl);

		// =========================================================================
		// 10. REAL-TIME ANIMATION LOOP
		// =========================================================================
		let lastTime = performance.now();
		let elapsedTime = 0;
		const localTargetVec = new THREE.Vector3();
		const worldTargetVec = new THREE.Vector3();
		const camOffsetVec = new THREE.Vector3();
		const viewDirVec = new THREE.Vector3();
		const upRefVec = new THREE.Vector3(0, 1, 0);
		const rightVec = new THREE.Vector3();

		function animate(now: number) {
			rafId = requestAnimationFrame(animate);
			const dt = Math.max(0, Math.min((now - lastTime) * 0.001, 0.05));
			lastTime = now;

			if (!isVisibleInViewport) return;

			elapsedTime += dt;

			// Subtle automatic orbital drift when idle
			if (isAutoDrifting && !isPointerDragging) {
				orbitState.theta += dt * 0.032;
			}

			// 1. Update Saturn System Tilt (Ring Inclination)
			const tiltRad = THREE.MathUtils.degToRad(orbitState.ringTilt);
			saturnSystemGroup.rotation.set(tiltRad, 0, tiltRad * 0.22);
			saturnSystemGroup.updateMatrixWorld();

			// Compute Saturn's polar / ring normal in world space
			ringNormalWorld.set(0, 1, 0).applyEuler(saturnSystemGroup.rotation).normalize();

			// 2. Transform camera target from Saturn-local frame into world space
			localTargetVec.set(orbitState.targetLocalX, orbitState.targetLocalY, orbitState.targetLocalZ);
			worldTargetVec.copy(localTargetVec).applyMatrix4(saturnSystemGroup.matrixWorld);

			// 3. Position Camera on spherical orbit around worldTargetVec
			camOffsetVec.set(
				orbitState.radius * Math.sin(orbitState.phi) * Math.sin(orbitState.theta),
				orbitState.radius * Math.cos(orbitState.phi),
				orbitState.radius * Math.sin(orbitState.phi) * Math.cos(orbitState.theta)
			);
			camera.position.copy(worldTargetVec).add(camOffsetVec);
			camera.lookAt(worldTargetVec);

			// 4. Compute Sun Direction from Solar Phase Angle!
			// Solar phase angle alpha is the angle between Sun-to-Target and Camera-to-Target.
			// alpha = 0 deg -> Sun directly behind camera (back-scatter opposition)
			// alpha = 170 deg -> Sun almost directly behind Saturn (high-phase forward-scatter eclipse!)
			viewDirVec.subVectors(camera.position, worldTargetVec).normalize();
			rightVec.crossVectors(upRefVec, viewDirVec);
			if (rightVec.lengthSq() < 0.001) {
				rightVec.set(1, 0, 0);
			} else {
				rightVec.normalize();
			}
			const phaseRad = THREE.MathUtils.degToRad(orbitState.solarPhase);
			sunDirectionWorld
				.copy(viewDirVec)
				.multiplyScalar(Math.cos(phaseRad))
				.addScaledVector(rightVec, Math.sin(phaseRad))
				.addScaledVector(upRefVec, Math.sin(phaseRad) * 0.22)
				.normalize();

			// 5. Update Shader Uniforms
			saturnMat.uniforms.uTime.value = elapsedTime;
			saturnMat.uniforms.uRingTiltRadians.value = tiltRad;
			ringMat.uniforms.uTime.value = elapsedTime;
			ringMat.uniforms.uHighlightRadiusKm.value = hoveredRadiusKm ?? selectedRadiusKm;
			titanMat.uniforms.uTime.value = elapsedTime;

			// 6. Animate Enceladus South-Polar Cryo-Plume Jets
			const plumeAttr = plumeGeo.getAttribute('position') as THREE.BufferAttribute;
			const phaseAttr = plumeGeo.getAttribute('aPhase') as THREE.BufferAttribute;
			for (let i = 0; i < PLUME_COUNT; i++) {
				let phase = phaseAttr.getX(i) + dt * (0.42 + (i % 7) * 0.04);
				if (phase > 1.0) phase -= 1.0;
				phaseAttr.setX(i, phase);

				const vent = ventOffsets[i % 4];
				const vx = plumeVelocities[i * 3 + 0];
				const vy = plumeVelocities[i * 3 + 1];
				const vz = plumeVelocities[i * 3 + 2];

				plumeAttr.setXYZ(
					i,
					vent[0] + vx * phase * 1.15,
					vent[1] + vy * phase * 1.15,
					vent[2] + vz * phase * 1.15
				);
			}
			plumeAttr.needsUpdate = true;
			phaseAttr.needsUpdate = true;

			// 7. Animate Huygens Descent Beacon on Titan
			const huygensProgress = THREE.MathUtils.clamp(((elapsedTime * 0.22) % 1.0 + 1.0) % 1.0, 0.001, 0.999);
			const huygensPos = huygensCurve.getPointAt(huygensProgress);
			huygensBeaconGroup.position.copy(huygensPos);
			huygensPulseRing.lookAt(camera.position);
			const pulseScale = 0.8 + 0.6 * Math.sin(elapsedTime * 5.0);
			huygensPulseRing.scale.setScalar(pulseScale);

			// 8. Position Cassini Spacecraft according to active preset
			const mode = CAMERA_PRESETS[activePresetIndex].cassiniMode;
			trajectoryGroup.visible = showTrajectoryOverlay;
			if (mode === 'soi') {
				const t = THREE.MathUtils.clamp(0.36 + 0.08 * Math.sin(elapsedTime * 0.35), 0.001, 0.999);
				cassiniGroup.position.copy(soiCurve.getPointAt(t));
				const tangent = soiCurve.getTangentAt(t);
				craftVisual.lookAt(cassiniGroup.position.clone().add(tangent));
				engineGlowMesh.visible = true;
				engineGlowMesh.scale.y = 0.85 + 0.25 * Math.sin(elapsedTime * 18.0);
			} else if (mode === 'finale') {
				const t = THREE.MathUtils.clamp(0.42 + 0.14 * Math.sin(elapsedTime * 0.45), 0.001, 0.999);
				cassiniGroup.position.copy(finaleCurve.getPointAt(t));
				const tangent = finaleCurve.getTangentAt(t);
				craftVisual.lookAt(cassiniGroup.position.clone().add(tangent));
				engineGlowMesh.visible = false;
			} else if (mode === 'enceladus') {
				cassiniGroup.position.set(
					ENCELADUS_LOCAL_POS.x + 0.32 * Math.cos(elapsedTime * 0.5),
					ENCELADUS_LOCAL_POS.y - 0.36,
					ENCELADUS_LOCAL_POS.z + 0.32 * Math.sin(elapsedTime * 0.5)
				);
				engineGlowMesh.visible = false;
			} else if (mode === 'titan') {
				cassiniGroup.position.set(
					TITAN_LOCAL_POS.x - 1.15,
					TITAN_LOCAL_POS.y + 0.72,
					TITAN_LOCAL_POS.z + 1.05
				);
				engineGlowMesh.visible = false;
			} else {
				const t = THREE.MathUtils.clamp(((elapsedTime * 0.04) % 1.0 + 1.0) % 1.0, 0.001, 0.999);
				cassiniGroup.position.copy(soiCurve.getPointAt(t));
				engineGlowMesh.visible = false;
			}
			cassiniBeacon.lookAt(camera.position);

			renderer.render(scene, camera);
		}

		rafId = requestAnimationFrame(animate);

		return () => {
			isDisposed = true;
			cancelAnimationFrame(rafId);
			if (activeTween) activeTween.kill();
			if (idleResumeTimer) clearTimeout(idleResumeTimer);
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			canvasEl?.removeEventListener('pointerdown', onPointerDown);
			canvasEl?.removeEventListener('pointermove', onPointerMove);
			canvasEl?.removeEventListener('pointerup', onPointerUp);
			canvasEl?.removeEventListener('wheel', onWheel);

			fallbackTexture.dispose();
			for (const tex of loadedTextures) {
				tex.dispose();
			}
			saturnGeo.dispose();
			saturnMat.dispose();
			saturnAtmoGeo.dispose();
			saturnAtmoMat.dispose();
			ringGeo.dispose();
			ringMat.dispose();
			titanGeo.dispose();
			titanMat.dispose();
			titanDetachedGeo.dispose();
			titanDetachedMat.dispose();
			huygensPathGeo.dispose();
			huygensPathMat.dispose();
			huygensShieldGeo.dispose();
			huygensShieldMat.dispose();
			huygensPulseRingGeo.dispose();
			huygensPulseRingMat.dispose();
			enceladusGeo.dispose();
			enceladusMat.dispose();
			plumeGeo.dispose();
			plumeMat.dispose();
			dishGeo.dispose();
			dishMat.dispose();
			feedRodGeo.dispose();
			silverMat.dispose();
			busGeo.dispose();
			goldKaptonMat.dispose();
			magBoomGeo.dispose();
			magBoomMat.dispose();
			engineGlowGeo.dispose();
			engineGlowMat.dispose();
			cassiniBeaconGeo.dispose();
			cassiniBeaconMat.dispose();
			soiGeo.dispose();
			soiMat.dispose();
			finaleGeo.dispose();
			finaleMat.dispose();
			starGeo.dispose();
			starMat.dispose();
			renderer.dispose();
		};
	};

	onMount(() => {
		if (window.innerWidth < 768) {
			mobileLiteMode = true;
		} else {
			cleanupSaturnWebGL = mountSaturnWebGL() ?? null;
		}

		return () => {
			if (cleanupSaturnWebGL) {
				cleanupSaturnWebGL();
				cleanupSaturnWebGL = null;
			}
		};
	});
</script>

<section
	aria-label="Interactive 3D Set Piece: Saturn's Rings as Cassini-Huygens Arrives"
	class="relative my-8 md:my-16 overflow-hidden border-y border-[rgba(232,230,225,0.12)] bg-[#050607]"
>
	{#if mobileLiteMode}
		<!-- Lightweight Mobile Documentary Plate (~420px total height) -->
		<div class="flex flex-col bg-[#050607]" data-testid="saturn-mobile-lite">
			<!-- Compact Top Bar with On-Demand 3D WebGL Toggle -->
			<div class="flex items-center justify-between gap-2 border-b border-[rgba(232,230,225,0.12)] px-4 py-2.5">
				<span class="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#C89B57] truncate">
					SET PIECE 01 · CASSINI–HUYGENS
				</span>
				<button
					type="button"
					onclick={enableInteractiveWebGL}
					class="shrink-0 cursor-pointer border border-[#C89B57]/50 bg-[rgba(200,155,87,0.10)] px-2.5 py-1 font-mono-tech text-[10px] uppercase tracking-[0.12em] text-[#C89B57] hover:bg-[rgba(200,155,87,0.20)] transition-colors"
				>
					[Enable Interactive 3D WebGL]
				</button>
			</div>

			<!-- Archival Photograph Backdrop with Slow Ken Burns Drift + Active Preset Copy -->
			<div class="relative min-h-[215px] overflow-hidden px-4 py-4 flex flex-col justify-end">
				<img
					src="/assets/chapters/cassini-saturn-eclipse-800.webp"
					alt="Cassini wide-angle mosaic of Saturn eclipsing the Sun, illuminating the E, F, G, and main ring system"
					loading="lazy"
					decoding="async"
					class="saturn-ken-burns pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-55"
				/>
				<div
					class="pointer-events-none absolute inset-0"
					style="background: linear-gradient(180deg, rgba(5,6,7,0.35) 0%, rgba(5,6,7,0.78) 55%, rgba(5,6,7,0.96) 100%);"
				></div>

				<div class="relative z-10">
					<div class="font-mono-tech text-[10px] uppercase tracking-[0.14em] text-[#C89B57]">
						{activePreset.indexLabel} · {activePreset.epoch}
					</div>
					<h3 class="mt-1 font-display text-xl font-normal tracking-[-0.02em] text-[#E8E6E1] leading-[1.12]">
						{activePreset.title}
					</h3>
					<p class="mt-1.5 font-sans text-base leading-[1.5] text-[rgba(232,230,225,0.84)]">
						{activePreset.caption}
					</p>
				</div>
			</div>

			<!-- Compact 2x2 Telemetry Grid -->
			<div class="grid grid-cols-2 border-t border-[rgba(232,230,225,0.12)] divide-x divide-y divide-[rgba(232,230,225,0.10)] font-mono-tech text-[11px] uppercase tracking-[0.12em]">
				<div class="px-3.5 py-2">
					<span class="text-[10px] text-[rgba(232,230,225,0.55)]">EARTH DIST</span>
					<div class="text-xs text-[#C89B57]">{activePreset.earthDistanceAu.toFixed(2)} AU</div>
				</div>
				<div class="px-3.5 py-2">
					<span class="text-[10px] text-[rgba(232,230,225,0.55)]">ONE-WAY LIGHT</span>
					<div class="text-xs text-[#E8E6E1]">{activePreset.oneWayLightTime}</div>
				</div>
				<div class="px-3.5 py-2">
					<span class="text-[10px] text-[rgba(232,230,225,0.55)]">CASSINI VEL</span>
					<div class="text-xs text-[#C89B57]">{activePreset.cassiniVelocityKmS.toFixed(2)} KM/S</div>
				</div>
				<div class="px-3.5 py-2">
					<span class="text-[10px] text-[rgba(232,230,225,0.55)]">OPTICAL DEPTH τ</span>
					<div class="text-xs text-[#E8E6E1]">{ringTelemetry.opticalDepthTau.toFixed(2)} ({ringTelemetry.saturnRadii.toFixed(2)} Rₛ)</div>
				</div>
			</div>

			<!-- Compact Preset Selector Tabs -->
			<div class="grid grid-cols-5 divide-x divide-[rgba(232,230,225,0.12)] border-t border-[rgba(232,230,225,0.12)]">
				{#each CAMERA_PRESETS as preset, idx (preset.id)}
					{@const isActive = activePresetIndex === idx}
					<button
						type="button"
						onclick={() => applyPreset(idx)}
						class="cursor-pointer px-2 py-2 text-left transition-colors {isActive
							? 'bg-[rgba(200,155,87,0.14)] text-[#E8E6E1]'
							: 'text-[rgba(232,230,225,0.68)] hover:bg-[rgba(232,230,225,0.04)]'}"
					>
						<div class="font-mono-tech text-[10px] uppercase tracking-[0.12em] {isActive ? 'text-[#C89B57]' : 'text-[rgba(232,230,225,0.55)]'}">
							{preset.indexLabel}
						</div>
						<div class="mt-0.5 truncate font-sans text-xs font-medium">
							{preset.shortLabel.split(' ')[0]}
						</div>
					</button>
				{/each}
			</div>
		</div>
	{:else}
	<!-- Top Mission Telemetry Hairline Bar -->
	<div
		class="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(232,230,225,0.12)] bg-[#050607] px-4 py-3.5 sm:px-6"
	>
		<div class="flex flex-wrap items-center gap-4">
			<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
				SET PIECE 01 · CASSINI–HUYGENS AT SATURN
			</span>
			<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
				EPOCH <strong class="font-normal text-[#E8E6E1]">{activePreset.epoch}</strong>
			</span>
		</div>

		<div class="flex flex-wrap items-center gap-6 font-mono-tech text-[11px] uppercase tracking-[0.16em]">
			<div class="flex items-center gap-2">
				<span class="text-[rgba(232,230,225,0.6)]">EARTH DIST</span>
				<span class="text-[#C89B57]">{activePreset.earthDistanceAu.toFixed(2)} AU</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-[rgba(232,230,225,0.6)]">ONE-WAY LIGHT</span>
				<span class="text-[#E8E6E1]">{activePreset.oneWayLightTime}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-[rgba(232,230,225,0.6)]">CASSINI VEL</span>
				<span class="text-[#C89B57]">{activePreset.cassiniVelocityKmS.toFixed(2)} KM/S</span>
			</div>
		</div>
	</div>

	<!-- Main Responsive 3D WebGL Viewport Container -->
	<div
		bind:this={containerEl}
		class="relative min-h-[560px] w-full select-none overflow-hidden lg:min-h-[660px]"
	>
		<canvas
			bind:this={canvasEl}
			class="block h-full min-h-[560px] w-full cursor-grab active:cursor-grabbing lg:min-h-[660px]"
		></canvas>

		<!-- Upper-Left Active Preset Editorial Caption -->
		<div
			class="pointer-events-none absolute top-4 left-4 right-4 sm:right-auto z-10 sm:max-w-lg border-l border-[rgba(232,230,225,0.18)] bg-[rgba(5,6,7,0.78)] pl-4 pr-4 py-3 backdrop-blur-sm sm:top-6 sm:left-6"
		>
			<div class="mb-1 flex items-center justify-between gap-3">
				<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57] truncate">
					{activePreset.missionPhase}
				</span>
				<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)] shrink-0">
					DRAG TO ORBIT
				</span>
			</div>
			<h3 class="font-display text-lg font-normal tracking-[-0.02em] text-[#E8E6E1] sm:text-2xl leading-[1.08]">
				{activePreset.title}
			</h3>
			<p class="mt-2 hidden sm:block font-sans text-base leading-[1.65] text-[rgba(232,230,225,0.72)] max-w-[65ch]">
				{activePreset.caption}
			</p>
		</div>

		<!-- Upper-Right Live Radial Optical Depth & Scattering Telemetry Overlay -->
		<div
			class="pointer-events-auto absolute top-4 right-4 z-10 hidden w-80 border border-[rgba(232,230,225,0.12)] bg-[rgba(5,6,7,0.82)] p-4 backdrop-blur-sm md:block sm:top-6 sm:right-6"
		>
			<div class="flex items-center justify-between border-b border-[rgba(232,230,225,0.12)] pb-2">
				<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
					{hoveredRadiusKm !== null ? 'CURSOR RING PROBE' : 'RING RADIAL TELEMETRY'}
				</span>
				<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
					{ringTelemetry.saturnRadii.toFixed(2)} Rₛ
				</span>
			</div>

			<div class="mt-3">
				<div class="font-display text-base font-normal text-[#E8E6E1] leading-snug">
					{ringTelemetry.regionName}
				</div>
				<p class="mt-1 font-sans text-base leading-[1.6] text-[rgba(232,230,225,0.72)]">
					{ringTelemetry.description}
				</p>
			</div>
			<div class="mt-3.5 grid grid-cols-3 gap-2 border-y border-[rgba(232,230,225,0.12)] py-2.5 font-mono-tech">
				<div>
					<div class="text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">RADIUS</div>
					<div class="mt-0.5 text-xs text-[#E8E6E1]">
						{ringTelemetry.radiusKm.toLocaleString()} km
					</div>
				</div>
				<div>
					<div class="text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">OPTICAL τ</div>
					<div class="mt-0.5 text-xs text-[#C89B57]">
						{ringTelemetry.opticalDepthTau.toFixed(3)}
					</div>
				</div>
				<div>
					<div class="text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">KEPLER</div>
					<div class="mt-0.5 text-xs text-[#E8E6E1]">
						{ringTelemetry.orbitalVelocityKmS} km/s
					</div>
				</div>
			</div>

			<!-- Ring Zone Index Links -->
			<div class="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
				{#each RING_ZONE_QUICK_STOPS as zone (zone.label)}
					{@const isZoneActive = Math.abs(effectiveSampleRadiusKm - zone.km) < 1600}
					<button
						type="button"
						onclick={() => (selectedRadiusKm = zone.km)}
						class="cursor-pointer border-b pb-0.5 font-mono-tech text-[11px] uppercase tracking-[0.16em] transition-colors duration-500 {isZoneActive
							? 'border-[#C89B57] text-[#C89B57]'
							: 'border-transparent text-[rgba(232,230,225,0.6)] hover:text-[#E8E6E1]'}"
					>
						{zone.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Bottom Interactive Preset Selector Index Inside Viewport -->
		<div
			class="pointer-events-auto absolute right-4 bottom-4 left-4 z-10 sm:right-6 sm:left-6"
		>
			<div class="grid grid-cols-2 border border-[rgba(232,230,225,0.12)] bg-[rgba(5,6,7,0.84)] backdrop-blur-sm sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(232,230,225,0.12)]">
				{#each CAMERA_PRESETS as preset, idx (preset.id)}
					{@const isActive = activePresetIndex === idx}
					<button
						type="button"
						onclick={() => applyPreset(idx)}
						class="group cursor-pointer px-3.5 py-2.5 text-left transition-colors duration-500 {isActive
							? 'bg-[rgba(200,155,87,0.10)]'
							: 'hover:bg-[rgba(232,230,225,0.04)]'}"
					>
						<div class="flex items-center justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em]">
							<span class={isActive ? 'text-[#C89B57]' : 'text-[rgba(232,230,225,0.6)] group-hover:text-[#E8E6E1]'}>
								{preset.indexLabel}
							</span>
							{#if isActive}
								<span class="h-1 w-1 rounded-full bg-[#C89B57]"></span>
							{/if}
						</div>
						<div
							class="mt-1 truncate font-display text-sm font-normal {isActive
								? 'text-[#E8E6E1]'
								: 'text-[rgba(232,230,225,0.72)]'}"
						>
							{preset.shortLabel}
						</div>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Bottom Interactive Optical & Geometry Control Hairline Deck -->
	<div
		class="relative z-20 grid grid-cols-1 gap-6 border-t border-[rgba(232,230,225,0.12)] bg-[#050607] px-4 py-5 sm:px-6 lg:grid-cols-12 lg:items-center"
	>
		<!-- Slider 1: Solar Phase Angle (Forward vs Back Scattering) -->
		<div class="lg:col-span-5">
			<div class="mb-2 flex items-center justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em]">
				<label for="saturn-solar-phase" class="text-[rgba(232,230,225,0.6)]">
					SOLAR PHASE ANGLE (α) <strong class="font-normal text-[#C89B57]">{solarPhaseAngleDeg}°</strong>
				</label>
				<button
					type="button"
					onclick={triggerHighPhaseEclipseMosaic}
					class="cursor-pointer border-b border-[rgba(200,155,87,0.45)] pb-0.5 text-[11px] uppercase tracking-[0.16em] text-[#C89B57] transition-colors duration-500 hover:text-[#DDB474]"
				>
					168° ECLIPSE HALO
				</button>
			</div>
			<input
				id="saturn-solar-phase"
				type="range"
				min="8"
				max="174"
				step="1"
				value={solarPhaseAngleDeg}
				oninput={handlePhaseSliderInput}
				class="h-1 w-full cursor-pointer appearance-none bg-[rgba(232,230,225,0.16)] accent-[#C89B57]"
			/>
			<div class="mt-1.5 flex justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
				<span>8° BACK-SCATTER</span>
				<span class="text-[#C89B57] truncate max-w-[220px]">{scatteringRegimeLabel}</span>
				<span>174° FORWARD HALO</span>
			</div>
		</div>

		<!-- Slider 2: Ring Plane Tilt / Seasonal Obliquity -->
		<div class="lg:col-span-3">
			<div class="mb-2 flex items-center justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em]">
				<label for="saturn-ring-tilt" class="text-[rgba(232,230,225,0.6)]">
					RING INCLINATION <strong class="font-normal text-[#C89B57]">{ringTiltDeg.toFixed(1)}°</strong>
				</label>
				<span class="text-[11px] text-[rgba(232,230,225,0.6)]">±26.7° MAX</span>
			</div>
			<input
				id="saturn-ring-tilt"
				type="range"
				min="-27"
				max="27"
				step="0.5"
				value={ringTiltDeg}
				oninput={handleTiltSliderInput}
				class="h-1 w-full cursor-pointer appearance-none bg-[rgba(232,230,225,0.16)] accent-[#C89B57]"
			/>
			<div class="mt-1.5 flex justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
				<span>-26.7° SOUTH</span>
				<span>0° EQUINOX</span>
				<span>+26.7° NORTH</span>
			</div>
		</div>

		<!-- Slider 3: Radial Optical Depth Scanner & Trajectory Toggle -->
		<div class="lg:col-span-4">
			<div class="mb-2 flex items-center justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em]">
				<label for="saturn-ring-radius" class="text-[rgba(232,230,225,0.6)]">
					SCANNER <strong class="font-normal text-[#E8E6E1]">{effectiveSampleRadiusKm.toLocaleString()} KM</strong>
					<span class="text-[#C89B57]">(τ {ringTelemetry.opticalDepthTau.toFixed(2)})</span>
				</label>
				<button
					type="button"
					onclick={() => (showTrajectoryOverlay = !showTrajectoryOverlay)}
					class="cursor-pointer border-b pb-0.5 text-[11px] uppercase tracking-[0.16em] transition-colors duration-500 {showTrajectoryOverlay
						? 'border-[#C89B57] text-[#C89B57]'
						: 'border-transparent text-[rgba(232,230,225,0.6)] hover:text-[#E8E6E1]'}"
				>
					{showTrajectoryOverlay ? 'ARCS: ON' : 'ARCS: OFF'}
				</button>
			</div>
			<input
				id="saturn-ring-radius"
				type="range"
				min={RING_INNER_RADIUS_KM}
				max={RING_OUTER_RADIUS_KM}
				step="100"
				value={selectedRadiusKm}
				oninput={handleRadiusSliderInput}
				class="h-1 w-full cursor-pointer appearance-none bg-[rgba(232,230,225,0.16)] accent-[#C89B57]"
			/>
			<div class="mt-1.5 flex justify-between font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[rgba(232,230,225,0.6)]">
				<span>66,900 KM (D)</span>
				<span>117,580 KM (DIV)</span>
				<span>140,180 KM (F)</span>
			</div>
		</div>
	</div>
	{/if}
</section>

<style>
	@keyframes saturnKenBurns {
		0% {
			transform: scale(1) translate3d(0, 0, 0);
		}
		100% {
			transform: scale(1.08) translate3d(-1.5%, -1%, 0);
		}
	}

	.saturn-ken-burns {
		will-change: transform;
		animation: saturnKenBurns 26s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;
	}

	@media (prefers-reduced-motion: reduce) {
		.saturn-ken-burns {
			animation: none;
			transform: none;
		}
	}
</style>
