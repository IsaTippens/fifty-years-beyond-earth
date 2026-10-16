<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface PulsarData {
		id: string;
		psr: string;
		commonName?: string;
		angleDeg: number;
		lengthPx: number;
		periodSec: number;
		binaryUnits: string;
		hyperfineCount: string;
		distanceKpc: string;
		notes: string;
	}

	interface GreetingItem {
		id: string;
		language: string;
		eraOrRegion: string;
		speaker: string;
		nativeScript: string;
		translation: string;
		fundamentalHz: number;
		formants: [number, number, number];
		cadence: number[];
	}

	interface MusicTrackItem {
		id: string;
		title: string;
		composerOrArtist: string;
		performer: string;
		duration: string;
		origin: string;
		significance: string;
		notesHz: number[];
		tempoMs: number;
		timbre: 'baroque' | 'slide-blues' | 'rock' | 'choral' | 'gamelan' | 'string-quartet';
	}

	// Authentic 14 Pulsars etched onto the Voyager Golden Record cover (Frank Drake & Carl Sagan, 1977)
	// Periods encoded in binary multiples of the 1420.40575177 MHz hydrogen hyperfine transition (0.70402418 ns)
	const PULSARS: PulsarData[] = [
		{
			id: 'p1',
			psr: 'PSR B0531+21',
			commonName: 'Crab Nebula Pulsar',
			angleDeg: 192,
			lengthPx: 92,
			periodSec: 0.0330911,
			binaryUnits: '10110011001110111011001111',
			hyperfineCount: '47,002,788',
			distanceKpc: '2.0 kpc (Taurus)',
			notes: 'Youngest pulsar on the map (SN 1054 CE); fast spin spin-down provides a cosmic chronometer.'
		},
		{
			id: 'p2',
			psr: 'PSR B0833-45',
			commonName: 'Vela Pulsar',
			angleDeg: 248,
			lengthPx: 54,
			periodSec: 0.0892347,
			binaryUnits: '111100010101111100011111011',
			hyperfineCount: '126,749,483',
			distanceKpc: '0.28 kpc (Vela)',
			notes: 'Nearby supernova remnant pulsar anchoring the southern galactic plane vector.'
		},
		{
			id: 'p3',
			psr: 'PSR B1919+21',
			commonName: 'CP 1919 (Bell & Hewish 1967)',
			angleDeg: 44,
			lengthPx: 66,
			periodSec: 1.33730119,
			binaryUnits: '1110001011011011011110011111101',
			hyperfineCount: '1,899,510,333',
			distanceKpc: '0.30 kpc (Vulpecula)',
			notes: 'First radio pulsar ever discovered by Jocelyn Bell Burnell in November 1967.'
		},
		{
			id: 'p4',
			psr: 'PSR B0329+54',
			commonName: 'Bright Northern Pulsar',
			angleDeg: 142,
			lengthPx: 108,
			periodSec: 0.71451866,
			binaryUnits: '111100011111000011010101001110',
			hyperfineCount: '1,014,906,446',
			distanceKpc: '1.06 kpc (Camelopardalis)',
			notes: 'Highest radio flux density at 400 MHz in the northern sky; longest ray toward outer Perseus arm.'
		},
		{
			id: 'p5',
			psr: 'PSR B0950+08',
			commonName: 'Local Bubble Pulsar',
			angleDeg: 221,
			lengthPx: 30,
			periodSec: 0.25306506,
			binaryUnits: '10101011001011101010111001101',
			hyperfineCount: '359,455,117',
			distanceKpc: '0.26 kpc (Leo)',
			notes: 'Shortest ray on the map, pinpointing the Sun within our immediate stellar neighborhood.'
		},
		{
			id: 'p6',
			psr: 'PSR B1133+16',
			angleDeg: 204,
			lengthPx: 38,
			periodSec: 1.18791116,
			binaryUnits: '1100100010111110011000111110010',
			hyperfineCount: '1,687,315,954',
			distanceKpc: '0.35 kpc (Leo)',
			notes: 'High proper-motion pulsar at high galactic latitude above the spiral plane.'
		},
		{
			id: 'p7',
			psr: 'PSR B1237+25',
			angleDeg: 175,
			lengthPx: 46,
			periodSec: 1.38244861,
			binaryUnits: '1110100111000011100111100010110',
			hyperfineCount: '1,963,638,038',
			distanceKpc: '0.85 kpc (Coma Berenices)',
			notes: 'Five-component pulse profile near the North Galactic Pole providing Z-axis triangulation.'
		},
		{
			id: 'p8',
			psr: 'PSR B1451-68',
			angleDeg: 312,
			lengthPx: 48,
			periodSec: 0.26337676,
			binaryUnits: '10110010011001101010011110111',
			hyperfineCount: '374,101,879',
			distanceKpc: '0.43 kpc (Circinus)',
			notes: 'Southern circumpolar reference ray anchoring the inner Centaurus direction.'
		},
		{
			id: 'p9',
			psr: 'PSR B1642-03',
			angleDeg: 342,
			lengthPx: 84,
			periodSec: 0.38768877,
			binaryUnits: '100000110101110011010010010101',
			hyperfineCount: '550,675,285',
			distanceKpc: '1.30 kpc (Ophiuchus)',
			notes: 'Points toward the Ophiuchus cloud complex and inner Sagittarius arm.'
		},
		{
			id: 'p10',
			psr: 'PSR B1749-28',
			commonName: 'Galactic Center Vector',
			angleDeg: 356,
			lengthPx: 76,
			periodSec: 0.56255317,
			binaryUnits: '101111100111111011101010100010',
			hyperfineCount: '799,053,218',
			distanceKpc: '1.20 kpc (Sagittarius)',
			notes: 'Aligned within 4° of the Galactic Center (Sgr A*), establishing the primary galactic X-axis.'
		},
		{
			id: 'p11',
			psr: 'PSR B1929+10',
			angleDeg: 28,
			lengthPx: 34,
			periodSec: 0.22651704,
			binaryUnits: '10011001010010101111101011011',
			hyperfineCount: '321,745,307',
			distanceKpc: '0.31 kpc (Aquila)',
			notes: 'One of the closest known old pulsars with strong thermal X-ray polar caps.'
		},
		{
			id: 'p12',
			psr: 'PSR B1933+16',
			angleDeg: 36,
			lengthPx: 116,
			periodSec: 0.35873542,
			binaryUnits: '11110010110000011101011110101',
			hyperfineCount: '509,549,813',
			distanceKpc: '3.70 kpc (Sagitta)',
			notes: 'Longest distant ray extending deep along the Cygnus-Orion spiral arm.'
		},
		{
			id: 'p13',
			psr: 'PSR B2016+28',
			angleDeg: 58,
			lengthPx: 62,
			periodSec: 0.55795339,
			binaryUnits: '101111010000011001010101100110',
			hyperfineCount: '792,519,654',
			distanceKpc: '0.98 kpc (Vulpecula)',
			notes: 'Exhibits sub-pulse drifting phenomena studied at Arecibo Observatory.'
		},
		{
			id: 'p14',
			psr: 'PSR B2217+47',
			angleDeg: 88,
			lengthPx: 74,
			periodSec: 0.53846738,
			binaryUnits: '101101100101110100011111110101',
			hyperfineCount: '764,841,653',
			distanceKpc: '1.50 kpc (Lacerta)',
			notes: 'Completes the 14-pulsar 3D heliocentric triangulation redundancy matrix.'
		}
	];

	const GREETINGS: GreetingItem[] = [
		{
			id: 'akkadian',
			language: 'Akkadian',
			eraOrRegion: 'Mesopotamia (c. 2500 BCE)',
			speaker: 'Assyriologist A. Kilmer',
			nativeScript: '𒀀𒁕𒉌𒅖 𒇻 𒋗𒌌𒈬 (Adanniš lu šulmu)',
			translation: 'May all be very well.',
			fundamentalHz: 196,
			formants: [520, 1180, 2450],
			cadence: [1.0, 1.18, 0.94, 1.25, 0.88]
		},
		{
			id: 'mandarin',
			language: 'Mandarin Chinese',
			eraOrRegion: 'East Asia (Modern)',
			speaker: 'liang-Yen',
			nativeScript: '各位都好吧？我们都很想念你们，有空请到这儿来玩。',
			translation:
				"Hope everyone's well. We are thinking about you all. Please come here to visit when you have time.",
			fundamentalHz: 242,
			formants: [640, 1520, 2780],
			cadence: [1.12, 0.92, 1.28, 1.05, 1.34, 0.86, 1.15]
		},
		{
			id: 'english',
			language: 'English',
			eraOrRegion: 'Ithaca, New York (1977)',
			speaker: 'Nick Sagan (age 6)',
			nativeScript: 'Hello from the children of planet Earth.',
			translation: 'Hello from the children of planet Earth.',
			fundamentalHz: 310,
			formants: [760, 1840, 3100],
			cadence: [1.0, 1.22, 0.95, 1.15, 1.08, 0.82]
		},
		{
			id: 'hindi',
			language: 'Hindi',
			eraOrRegion: 'South Asia',
			speaker: 'Dharam Vir Bharati',
			nativeScript: 'धरती के वासियों की ओर से नमस्कार (Dharti ke vasiyon ki or se namaskar)',
			translation: 'Greetings from the inhabitants of this world.',
			fundamentalHz: 185,
			formants: [480, 1340, 2520],
			cadence: [0.95, 1.1, 1.02, 1.24, 0.9, 1.05]
		},
		{
			id: 'quechua',
			language: 'Quechua',
			eraOrRegion: 'Andean Highlands',
			speaker: 'Fredy Amílcar Roncalla',
			nativeScript: 'Kay pachamamamanta pitapas maytapas rimaykullaykichis.',
			translation: 'Hello to everybody from this Earth, in our language Quechua.',
			fundamentalHz: 215,
			formants: [550, 1410, 2630],
			cadence: [1.08, 1.0, 1.19, 0.92, 1.14, 0.89]
		},
		{
			id: 'greek',
			language: 'Ancient Greek',
			eraOrRegion: 'Classical Antiquity (c. 500 BCE)',
			speaker: 'Frederick M. Ahl',
			nativeScript: 'Οἵτινές ποτ᾽ ἐστὲ χαίρετε· εἰρηνικῶς πρὸς φίλους ἐρχόμεθα.',
			translation:
				'Greetings to you, whoever you are. We come in friendship to those who are friends.',
			fundamentalHz: 168,
			formants: [440, 1120, 2390],
			cadence: [1.05, 1.2, 0.98, 1.12, 0.85, 1.0]
		}
	];

	const MUSIC_TRACKS: MusicTrackItem[] = [
		{
			id: 'bach-brandenburg',
			title: 'Brandenburg Concerto No. 2 in F Major, BWV 1047 (I. Allegro)',
			composerOrArtist: 'Johann Sebastian Bach (1721)',
			performer: 'Munich Bach Orchestra, cond. Karl Richter',
			duration: '4:40',
			origin: 'Köthen, Germany',
			significance:
				'Opening musical work on the Golden Record; mathematical counterpoint linking music to orbital resonance.',
			notesHz: [349.23, 440.0, 523.25, 698.46, 587.33, 523.25, 440.0, 349.23],
			tempoMs: 210,
			timbre: 'baroque'
		},
		{
			id: 'blind-willie',
			title: 'Dark Was the Night, Cold Was the Ground',
			composerOrArtist: 'Blind Willie Johnson (1927)',
			performer: 'Blind Willie Johnson (slide guitar & wordless vocal hum)',
			duration: '3:15',
			origin: 'Texas, United States',
			significance:
				'Selected by Timothy Ferris and Carl Sagan to express the profound night and solitude of a species facing the cosmos.',
			notesHz: [146.83, 220.0, 293.66, 277.18, 220.0, 196.0, 146.83],
			tempoMs: 460,
			timbre: 'slide-blues'
		},
		{
			id: 'chuck-berry',
			title: 'Johnny B. Goode',
			composerOrArtist: 'Chuck Berry (1958)',
			performer: 'Chuck Berry',
			duration: '2:38',
			origin: 'St. Louis / Chicago, USA',
			significance:
				'Kinetic electric rock & roll celebrating youthful terrestrial energy and electromagnetic amplification.',
			notesHz: [233.08, 293.66, 349.23, 392.0, 466.16, 466.16, 392.0, 349.23],
			tempoMs: 165,
			timbre: 'rock'
		},
		{
			id: 'tchakrulo',
			title: 'Tchakrulo (ჩაკრულო)',
			composerOrArtist: 'Traditional Georgian Polyphony',
			performer: 'State Ensemble of Georgian Folk Song (Radio Moscow)',
			duration: '2:18',
			origin: 'Kakheti, Georgia',
			significance:
				'Intricate three-part vocal polyphony with sustained bass drone and soaring microtonal tenor ornamentation.',
			notesHz: [164.81, 246.94, 329.63, 369.99, 329.63, 293.66, 246.94],
			tempoMs: 380,
			timbre: 'choral'
		},
		{
			id: 'gamelan',
			title: 'Kinds of Flowers (Ketawang Puspawarna)',
			composerOrArtist: 'Mangkunegara IV',
			performer: 'Pura Paku Alaman Court Gamelan, dir. K.R.T. Wasitodipuro',
			duration: '4:43',
			origin: 'Yogyakarta, Java, Indonesia',
			significance:
				'Interlocking bronze metallophone cycles mirroring nested planetary periodicities.',
			notesHz: [261.63, 311.13, 392.0, 466.16, 523.25, 392.0, 311.13],
			tempoMs: 310,
			timbre: 'gamelan'
		},
		{
			id: 'beethoven-cavatina',
			title: 'String Quartet No. 13 in B-flat Major, Op. 130 (V. Cavatina)',
			composerOrArtist: 'Ludwig van Beethoven (1825)',
			performer: 'Budapest String Quartet',
			duration: '6:37',
			origin: 'Vienna, Austria',
			significance:
				'Final track on the Golden Record; Beethoven wrote that no other piece he composed moved him to such tears.',
			notesHz: [155.56, 196.0, 233.08, 311.13, 293.66, 261.63, 233.08, 196.0],
			tempoMs: 520,
			timbre: 'string-quartet'
		}
	];

	type SynthMode = 'greetings' | 'music' | 'pulsar' | 'video-scan';
	type VideoImageId = 'circle' | 'solar-map' | 'dna' | 'humans';

	let selectedPulsar = $state<PulsarData>(PULSARS[0]);
	let activeMode = $state<SynthMode>('greetings');
	let selectedGreeting = $state<GreetingItem>(GREETINGS[0]);
	let selectedTrack = $state<MusicTrackItem>(MUSIC_TRACKS[0]);
	let selectedVideoSlide = $state<VideoImageId>('circle');
	let uraniumElapsedGyr = $state<number>(0.000000049); // 49 years since 1977 in Gyr, slider 0 to 9.0 Gyr
	let isPlayingAudio = $state<boolean>(false);
	let scanlineProgress = $state<number>(512);

	let widgetContainer: HTMLElement | undefined = $state();
	let oscCanvas: HTMLCanvasElement | undefined = $state();
	let animFrameId: number | null = null;
	let isCanvasVisible = false;
	let audioCtx: AudioContext | null = null;
	let masterGain: GainNode | null = null;
	let stepTimer: ReturnType<typeof setInterval> | null = null;
	let noteIndex = 0;
	let phaseTime = 0;
	// Uranium-238 decay calculation: t_1/2 = 4.468 Gyr
	const U238_HALF_LIFE_GYR = 4.468;
	let u238RemainingFraction = $derived(Math.pow(0.5, uraniumElapsedGyr / U238_HALF_LIFE_GYR));
	let pb206AccumulatedFraction = $derived(1 - u238RemainingFraction);

	function selectPulsar(p: PulsarData) {
		selectedPulsar = p;
		if (isPlayingAudio && activeMode === 'pulsar') {
			restartAudioLoop();
		}
	}

	function triggerSynthStep() {
		if (!audioCtx || !masterGain || !isPlayingAudio) return;
		const now = audioCtx.currentTime;

		if (activeMode === 'pulsar') {
			// Synthesize crisp radio pulsar dispersion click + 1420 MHz sub-harmonic ping
			const osc = audioCtx.createOscillator();
			const env = audioCtx.createGain();
			osc.type = 'sawtooth';
			const baseFreq = Math.min(880, Math.max(110, 120 / Math.sqrt(selectedPulsar.periodSec)));
			osc.frequency.setValueAtTime(baseFreq * 2.2, now);
			osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.045);

			env.gain.setValueAtTime(0.001, now);
			env.gain.linearRampToValueAtTime(0.28, now + 0.004);
			env.gain.exponentialRampToValueAtTime(0.0008, now + 0.055);

			osc.connect(env);
			env.connect(masterGain);
			osc.start(now);
			osc.stop(now + 0.06);
		} else if (activeMode === 'greetings') {
			// Synthesize formant-shaped vocal greeting prosody + warm golden disc carrier
			const stepRatio =
				selectedGreeting.cadence[noteIndex % selectedGreeting.cadence.length] ?? 1.0;
			const pitch = selectedGreeting.fundamentalHz * stepRatio;

			const carrier = audioCtx.createOscillator();
			const sub = audioCtx.createOscillator();
			const filter1 = audioCtx.createBiquadFilter();
			const env = audioCtx.createGain();

			carrier.type = 'triangle';
			carrier.frequency.setValueAtTime(pitch, now);
			carrier.frequency.exponentialRampToValueAtTime(pitch * 0.97, now + 0.28);

			sub.type = 'sine';
			sub.frequency.setValueAtTime(selectedGreeting.formants[0], now);

			filter1.type = 'bandpass';
			filter1.frequency.setValueAtTime(selectedGreeting.formants[1], now);
			filter1.Q.setValueAtTime(4.5, now);

			env.gain.setValueAtTime(0.001, now);
			env.gain.linearRampToValueAtTime(0.22, now + 0.04);
			env.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

			carrier.connect(filter1);
			sub.connect(env);
			filter1.connect(env);
			env.connect(masterGain);

			carrier.start(now);
			sub.start(now);
			carrier.stop(now + 0.34);
			sub.stop(now + 0.34);
			noteIndex++;
		} else if (activeMode === 'music') {
			const notes = selectedTrack.notesHz;
			const freq = notes[noteIndex % notes.length];
			const dur = (selectedTrack.tempoMs / 1000) * 0.92;

			const osc1 = audioCtx.createOscillator();
			const osc2 = audioCtx.createOscillator();
			const env = audioCtx.createGain();

			if (selectedTrack.timbre === 'baroque') {
				osc1.type = 'triangle';
				osc2.type = 'sine';
				osc2.frequency.setValueAtTime(freq * 1.5, now);
			} else if (selectedTrack.timbre === 'slide-blues') {
				osc1.type = 'sawtooth';
				osc2.type = 'triangle';
				osc1.frequency.setValueAtTime(freq * 0.96, now);
				osc1.frequency.exponentialRampToValueAtTime(freq, now + dur * 0.35);
				osc2.frequency.setValueAtTime(freq * 0.5, now);
			} else if (selectedTrack.timbre === 'gamelan') {
				osc1.type = 'sine';
				osc2.type = 'sine';
				osc2.frequency.setValueAtTime(freq * 2.76, now); // metallic inharmonic overtone
			} else {
				osc1.type = 'sine';
				osc2.type = 'triangle';
				osc2.frequency.setValueAtTime(freq * 1.25, now);
			}

			if (selectedTrack.timbre !== 'slide-blues') {
				osc1.frequency.setValueAtTime(freq, now);
			}

			env.gain.setValueAtTime(0.001, now);
			env.gain.linearRampToValueAtTime(0.2, now + 0.025);
			env.gain.exponentialRampToValueAtTime(0.001, now + dur);

			osc1.connect(env);
			osc2.connect(env);
			env.connect(masterGain);

			osc1.start(now);
			osc2.start(now);
			osc1.stop(now + dur + 0.02);
			osc2.stop(now + dur + 0.02);
			noteIndex++;
		} else if (activeMode === 'video-scan') {
			// Analog slow-scan TV 8ms line sync chirp
			const osc = audioCtx.createOscillator();
			const env = audioCtx.createGain();
			osc.type = 'sine';
			const scanFreq = 440 + Math.sin(noteIndex * 0.35) * 260;
			osc.frequency.setValueAtTime(scanFreq, now);
			osc.frequency.linearRampToValueAtTime(scanFreq * 1.15, now + 0.09);

			env.gain.setValueAtTime(0.001, now);
			env.gain.linearRampToValueAtTime(0.14, now + 0.01);
			env.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

			osc.connect(env);
			env.connect(masterGain);
			osc.start(now);
			osc.stop(now + 0.12);
			noteIndex++;
		}
	}

	function restartAudioLoop() {
		if (stepTimer) {
			clearInterval(stepTimer);
			stepTimer = null;
		}
		if (!isPlayingAudio) return;

		let intervalMs = 360;
		if (activeMode === 'pulsar') {
			intervalMs = Math.max(95, Math.min(900, Math.round(selectedPulsar.periodSec * 650)));
		} else if (activeMode === 'music') {
			intervalMs = selectedTrack.tempoMs;
		} else if (activeMode === 'video-scan') {
			intervalMs = 140;
		}

		triggerSynthStep();
		stepTimer = setInterval(triggerSynthStep, intervalMs);
	}

	async function toggleAudioPlayback() {
		if (isPlayingAudio) {
			isPlayingAudio = false;
			if (stepTimer) {
				clearInterval(stepTimer);
				stepTimer = null;
			}
			if (audioCtx && audioCtx.state === 'running') {
				await audioCtx.suspend();
			}
			return;
		}

		const AudioContextCtor =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		if (!audioCtx) {
			audioCtx = new AudioContextCtor();
			masterGain = audioCtx.createGain();
			masterGain.gain.value = 0.35;
			masterGain.connect(audioCtx.destination);
		}
		if (audioCtx.state === 'suspended') {
			await audioCtx.resume();
		}
		isPlayingAudio = true;
		restartAudioLoop();
	}

	function switchMode(mode: SynthMode) {
		activeMode = mode;
		noteIndex = 0;
		if (mode === 'video-scan') {
			scanlineProgress = 32;
		}
		if (isPlayingAudio) {
			restartAudioLoop();
		}
	}

	function renderOscilloscope() {
		if (!isCanvasVisible || !oscCanvas) {
			animFrameId = null;
			return;
		}
		const ctx = oscCanvas.getContext('2d');
		if (!ctx) return;

		const w = oscCanvas.width;
		const h = oscCanvas.height;
		phaseTime += isPlayingAudio ? 0.065 : 0.018;

		// Archival persistence clear
		ctx.fillStyle = 'rgba(5, 6, 7, 0.34)';
		ctx.fillRect(0, 0, w, h);

		// Subtle telemetry graticule grid
		ctx.strokeStyle = 'rgba(232, 230, 225, 0.05)';
		ctx.lineWidth = 1;
		const gridX = 48;
		const gridY = 32;
		for (let x = 0; x < w; x += gridX) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
		}
		for (let y = 0; y < h; y += gridY) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}

		// Split canvas: Left 62% waveform oscilloscope, Right 38% 512-line SSTV video frame decoder
		const splitX = Math.floor(w * 0.62);

		// Divider
		ctx.strokeStyle = 'rgba(200, 155, 87, 0.24)';
		ctx.beginPath();
		ctx.moveTo(splitX, 0);
		ctx.lineTo(splitX, h);
		ctx.stroke();

		// 1. Left Oscilloscope Waveform
		ctx.save();
		ctx.beginPath();
		ctx.rect(0, 0, splitX - 4, h);
		ctx.clip();

		const midY = h * 0.52;
		ctx.strokeStyle = isPlayingAudio ? '#DDB474' : '#C89B57';
		ctx.shadowColor = 'rgba(200, 155, 87, 0.35)';
		ctx.shadowBlur = 4;
		ctx.lineWidth = 1.6;
		ctx.beginPath();

		for (let x = 8; x < splitX - 10; x += 2) {
			const norm = x / (splitX - 18);
			let yOffset = 0;

			if (activeMode === 'pulsar') {
				const pulseRate = Math.max(2, Math.min(14, 2.2 / selectedPulsar.periodSec));
				const phase = (norm * pulseRate + phaseTime * 0.5) % 1;
				const spike = Math.exp(-Math.pow((phase - 0.5) * 18, 2));
				const ring = Math.sin(norm * 140 - phaseTime * 8) * spike;
				yOffset = -spike * (h * 0.34) + ring * (h * 0.12);
			} else if (activeMode === 'greetings') {
				const f0 = selectedGreeting.fundamentalHz / 90;
				const f1 = selectedGreeting.formants[0] / 180;
				const env = Math.sin(norm * Math.PI) * (0.65 + 0.35 * Math.sin(phaseTime * 2.1));
				yOffset =
					(Math.sin(norm * f0 * 14 + phaseTime * 3) * 0.6 +
						Math.sin(norm * f1 * 18 - phaseTime * 5) * 0.4) *
					(h * 0.3) *
					env;
			} else if (activeMode === 'music') {
				const freq = selectedTrack.notesHz[noteIndex % selectedTrack.notesHz.length] / 110;
				const harmonic =
					Math.sin(norm * freq * 12 + phaseTime * 4) * 0.65 +
					Math.sin(norm * freq * 24 - phaseTime * 2.5) * 0.25 +
					Math.cos(norm * freq * 36 + phaseTime) * 0.1;
				yOffset = harmonic * (h * 0.31) * Math.sin(norm * Math.PI);
			} else {
				// Video scanline sync pulse + luminance modulation
				const inSync = norm < 0.12;
				yOffset = inSync
					? h * 0.28
					: Math.sin(norm * 45 + phaseTime * 4) *
						Math.cos(norm * 12 - phaseTime) *
						(h * 0.24);
			}

			const y = midY + yOffset;
			if (x === 8) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
		ctx.restore();

		// 2. Right Panel: 512-Scanline Analog Video Frame Reconstructor
		const frameW = w - splitX - 24;
		const frameH = h - 36;
		const frameX = splitX + 12;
		const frameY = 24;

		ctx.strokeStyle = 'rgba(200, 155, 87, 0.3)';
		ctx.lineWidth = 1;
		ctx.strokeRect(frameX, frameY, frameW, frameH);

		// Advance scanlines smoothly
		if (scanlineProgress < 512) {
			scanlineProgress = Math.min(512, scanlineProgress + (isPlayingAudio ? 4.5 : 2.2));
		} else if (activeMode === 'video-scan' || isPlayingAudio) {
			scanlineProgress = (scanlineProgress + 2) % 512;
			if (scanlineProgress < 24) scanlineProgress = 24;
		}

		const activeRatio = scanlineProgress / 512;
		const cx = frameX + frameW / 2;
		const cy = frameY + frameH / 2;
		const radius = Math.min(frameW, frameH) * 0.36;

		ctx.save();
		ctx.beginPath();
		ctx.rect(frameX, frameY, frameW * activeRatio, frameH);
		ctx.clip();

		// Vertical scanline raster effect (Voyager video frames are scanned vertically, 512 lines)
		ctx.strokeStyle = 'rgba(200, 155, 87, 0.12)';
		for (let sx = frameX; sx < frameX + frameW * activeRatio; sx += 4) {
			ctx.beginPath();
			ctx.moveTo(sx, frameY);
			ctx.lineTo(sx, frameY + frameH);
			ctx.stroke();
		}

		ctx.strokeStyle = '#C89B57';
		ctx.lineWidth = 1.5;
		ctx.shadowColor = 'rgba(200, 155, 87, 0.35)';
		ctx.shadowBlur = 3;

		if (selectedVideoSlide === 'circle') {
			// Image #1: Calibration Circle
			ctx.beginPath();
			ctx.arc(cx, cy, radius, 0, Math.PI * 2);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
			ctx.fillStyle = '#C89B57';
			ctx.fill();
		} else if (selectedVideoSlide === 'solar-map') {
			// Image #2: Solar Location Map
			ctx.beginPath();
			ctx.arc(cx, cy, 4, 0, Math.PI * 2);
			ctx.fillStyle = '#C89B57';
			ctx.fill();
			for (let i = 0; i < 14; i++) {
				const a = (PULSARS[i].angleDeg * Math.PI) / 180;
				const len = (PULSARS[i].lengthPx / 120) * radius * 1.15;
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
				ctx.stroke();
			}
		} else if (selectedVideoSlide === 'dna') {
			// Image #12: DNA Double Helix Structure
			for (let s = -1; s <= 1; s += 2) {
				ctx.beginPath();
				for (let t = 0; t <= 1; t += 0.04) {
					const dx = frameX + 14 + t * (frameW - 28);
					const dy = cy + Math.sin(t * Math.PI * 3 + (s > 0 ? 0 : Math.PI)) * (radius * 0.68);
					if (t === 0) ctx.moveTo(dx, dy);
					else ctx.lineTo(dx, dy);
				}
				ctx.stroke();
			}
			// Base-pair rungs
			for (let t = 0.08; t < 0.95; t += 0.1) {
				const dx = frameX + 14 + t * (frameW - 28);
				const dy1 = cy + Math.sin(t * Math.PI * 3) * (radius * 0.68);
				const dy2 = cy + Math.sin(t * Math.PI * 3 + Math.PI) * (radius * 0.68);
				ctx.beginPath();
				ctx.moveTo(dx, dy1);
				ctx.lineTo(dx, dy2);
				ctx.stroke();
			}
		} else if (selectedVideoSlide === 'humans') {
			// Silhouette of Human Couple (Sagan/Drake slide)
			const leftP = cx - radius * 0.38;
			const rightP = cx + radius * 0.38;
			// Left figure
			ctx.beginPath();
			ctx.arc(leftP, cy - radius * 0.55, radius * 0.16, 0, Math.PI * 2);
			ctx.moveTo(leftP, cy - radius * 0.39);
			ctx.lineTo(leftP, cy + radius * 0.25);
			ctx.moveTo(leftP - radius * 0.24, cy - radius * 0.15);
			ctx.lineTo(leftP + radius * 0.24, cy - radius * 0.28);
			ctx.moveTo(leftP, cy + radius * 0.25);
			ctx.lineTo(leftP - radius * 0.18, cy + radius * 0.78);
			ctx.moveTo(leftP, cy + radius * 0.25);
			ctx.lineTo(leftP + radius * 0.18, cy + radius * 0.78);
			ctx.stroke();
			// Right figure
			ctx.beginPath();
			ctx.arc(rightP, cy - radius * 0.48, radius * 0.15, 0, Math.PI * 2);
			ctx.moveTo(rightP, cy - radius * 0.33);
			ctx.lineTo(rightP, cy + radius * 0.28);
			ctx.moveTo(rightP - radius * 0.22, cy - radius * 0.1);
			ctx.lineTo(rightP + radius * 0.22, cy + radius * 0.05);
			ctx.moveTo(rightP, cy + radius * 0.28);
			ctx.lineTo(rightP - radius * 0.16, cy + radius * 0.78);
			ctx.moveTo(rightP, cy + radius * 0.28);
			ctx.lineTo(rightP + radius * 0.16, cy + radius * 0.78);
			ctx.stroke();
		}
		ctx.restore();

		// Active scanline beam cursor
		const scanBeamX = frameX + frameW * activeRatio;
		ctx.strokeStyle = 'rgba(232, 230, 225, 0.72)';
		ctx.lineWidth = 1.2;
		ctx.beginPath();
		ctx.moveTo(scanBeamX, frameY);
		ctx.lineTo(scanBeamX, frameY + frameH);
		ctx.stroke();

		// Labels on canvas
		ctx.fillStyle = 'rgba(232, 230, 225, 0.65)';
		ctx.font = '10px "JetBrains Mono", monospace';
		ctx.fillText(
			`16⅔ RPM · ANALOG SIGNAL (${activeMode.toUpperCase()})`,
			12,
			16
		);
		ctx.fillText(
			`SSTV 512-LINE DECODE [${Math.floor(scanlineProgress)}/512]`,
			frameX,
			16
		);

		animFrameId = requestAnimationFrame(renderOscilloscope);
	}

	onMount(() => {
		if (!widgetContainer) return;
		const observer = new IntersectionObserver(
			(entries) => {
				const vis = entries.some((e) => e.isIntersecting);
				isCanvasVisible = vis;
				if (vis && animFrameId === null) {
					animFrameId = requestAnimationFrame(renderOscilloscope);
				} else if (!vis && animFrameId !== null) {
					cancelAnimationFrame(animFrameId);
					animFrameId = null;
				}
			},
			{ rootMargin: '150px' }
		);
		observer.observe(widgetContainer);
		return () => observer.disconnect();
	});

	onDestroy(() => {
		isCanvasVisible = false;
		if (animFrameId !== null) cancelAnimationFrame(animFrameId);
		if (stepTimer) clearInterval(stepTimer);
		if (audioCtx) {
			audioCtx.close().catch(() => {});
		}
	});
</script>

<div
	bind:this={widgetContainer}
	class="mt-5 md:mt-10 border-y border-[#C89B57]/30 bg-[#050607]/85 p-3.5 sm:p-6"
>
	<!-- Top Artifact Header -->
	<div class="flex flex-wrap items-start justify-between gap-3 sm:gap-6 border-b border-[#E8E6E1]/12 pb-4 sm:pb-6">
		<div>
			<div class="flex flex-wrap items-center gap-2 sm:gap-3 font-mono-tech text-[11px] uppercase tracking-[0.16em]">
				<span class="inline-flex items-center gap-2 text-[#C89B57]">
					<span class="h-1.5 w-1.5 rounded-full bg-[#C89B57]"></span>
					ARCHIVAL ARTIFACT · VOYAGER 1 &amp; 2
				</span>
				<span class="text-[#E8E6E1]/30">·</span>
				<span class="text-[#E8E6E1]/60">
					12-INCH GOLD-PLATED COPPER PHONOGRAPH DISC
				</span>
			</div>
			<h4 class="mt-2 sm:mt-3 font-display text-xl sm:text-2xl md:text-3xl font-normal tracking-tight text-[#E8E6E1] break-words">
				The Sounds of Earth: Golden Record Cover Diagram &amp; Signal Decoder
			</h4>
			<p class="mt-2 max-w-[65ch] font-sans text-base text-[#E8E6E1]/75 leading-[1.6]">
				Curated by Carl Sagan, Frank Drake, Ann Druyan, Timothy Ferris, Jon Lomax, and Linda
				Salzman Sagan. Designed to remain playable for <span class="text-[#C89B57] font-mono-tech"
					>1,000,000,000+ years</span
				> in interstellar space using pure physical constants—the 1420.405 MHz neutral hydrogen
				spin-flip transition and 14 millisecond/second radio pulsars.
			</p>
		</div>

		<!-- Audio Synthesizer Toggle -->
		<button
			type="button"
			onclick={toggleAudioPlayback}
			class="group relative inline-flex items-center gap-2.5 border px-3.5 py-2 font-mono-tech text-[11px] uppercase tracking-[0.16em] transition-colors duration-500 cursor-pointer {isPlayingAudio
				? 'border-[#C89B57] bg-[#C89B57]/18 text-[#E8E6E1]'
				: 'border-[#E8E6E1]/20 bg-transparent text-[#E8E6E1]/80 hover:border-[#C89B57] hover:text-[#C89B57]'}"
			aria-pressed={isPlayingAudio}
		>
			<span
				class="flex h-2 w-2 items-center justify-center rounded-full {isPlayingAudio
					? 'bg-[#DDB474]'
					: 'bg-[#C89B57]'}"
			></span>
			{#if isPlayingAudio}
				<span>MUTE SYNTHESIZER (PLAYING)</span>
			{:else}
				<span>PLAY GOLDEN RECORD SIGNAL</span>
			{/if}
		</button>
	</div>

	<!-- Main 2-Column Layout: Left = Precision Gold Cover SVG, Right = Telemetry & Synthesizer -->
	<div class="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
		<!-- LEFT: Interactive Gold-Plated Aluminum Cover SVG -->
		<div class="lg:col-span-6 flex flex-col items-center">
			<div
				class="relative w-full max-w-[460px] overflow-x-auto border border-[#E8E6E1]/12 bg-[#050607] p-2.5 sm:p-4 flex items-center justify-center"
			>
				<div class="min-w-[420px] w-full">
				<svg
					viewBox="0 0 500 500"
					class="w-full h-auto select-none"
					role="img"
					aria-label="Interactive Voyager Golden Record Cover Diagram"
				>
					<defs>
						<radialGradient id="goldPlateGrad" cx="38%" cy="32%" r="68%">
							<stop offset="0%" stop-color="#DDB474" />
							<stop offset="45%" stop-color="#C89B57" />
							<stop offset="82%" stop-color="#8A6632" />
							<stop offset="100%" stop-color="#4A3516" />
						</radialGradient>
						<radialGradient id="goldInnerSheen" cx="50%" cy="50%" r="50%">
							<stop offset="0%" stop-color="#17120A" stop-opacity="0.95" />
							<stop offset="82%" stop-color="#0B0906" stop-opacity="0.98" />
							<stop offset="100%" stop-color="#1F170B" stop-opacity="0.98" />
						</radialGradient>
						<filter id="etchGlow" x="-20%" y="-20%" width="140%" height="140%">
							<feDropShadow dx="0" dy="0" stdDeviation="1.2" flood-color="#C89B57" flood-opacity="0.35" />
						</filter>
					</defs>

					<!-- Outer Anodized Gold-Plated Aluminum Protective Cover Disc -->
					<circle
						cx="250"
						cy="250"
						r="236"
						fill="url(#goldInnerSheen)"
						stroke="url(#goldPlateGrad)"
						stroke-width="4"
					/>
					<circle
						cx="250"
						cy="250"
						r="226"
						fill="none"
						stroke="#C89B57"
						stroke-opacity="0.28"
						stroke-width="1"
						stroke-dasharray="3 3"
					/>

					<!-- Mounting Rim Screws (6 perimeter bolts) -->
					{#each [30, 90, 150, 210, 270, 330] as deg}
						{@const rad = (deg * Math.PI) / 180}
						<circle
							cx={250 + Math.cos(rad) * 231}
							cy={250 + Math.sin(rad) * 231}
							r="2.5"
							fill="#E8E6E1"
							opacity="0.55"
						/>
					{/each}

					<!-- ============================================================ -->
					<!-- 1. TOP-LEFT: PHONOGRAPH RECORD & STYLUS PLAYBACK INSTRUCTIONS -->
					<!-- ============================================================ -->
					<g transform="translate(86, 76)" stroke="#C89B57" fill="none" filter="url(#etchGlow)">
						<text
							x="-18"
							y="-14"
							fill="#E8E6E1"
							stroke="none"
							font-family="monospace"
							font-size="14.5"
						>
							I. STYLUS &amp; 16⅔ RPM
						</text>
						<!-- Record plan view -->
						<circle cx="52" cy="52" r="42" stroke-width="1.5" />
						<circle cx="52" cy="52" r="28" stroke-width="0.7" stroke-opacity="0.55" />
						<circle cx="52" cy="52" r="8" stroke-width="1.3" />
						<!-- Binary rotation period around circumference (3.6 seconds = 5.11×10^9 hyperfine transitions) -->
						{#each [0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as bit, idx}
							{@const a = ((idx * 22.5 - 90) * Math.PI) / 180}
							{#if bit === 1}
								<line
									x1={52 + Math.cos(a) * 44}
									y1={52 + Math.sin(a) * 44}
									x2={52 + Math.cos(a) * 50}
									y2={52 + Math.sin(a) * 50}
									stroke-width="1.4"
								/>
							{:else}
								<line
									x1={52 + Math.cos(a - 0.06) * 47}
									y1={52 + Math.sin(a - 0.06) * 47}
									x2={52 + Math.cos(a + 0.06) * 47}
									y2={52 + Math.sin(a + 0.06) * 47}
									stroke-width="1.3"
								/>
							{/if}
						{/each}
						<!-- Cartridge stylus arm -->
						<path d="M 84 18 L 98 8 L 106 16 L 88 26 Z" stroke-width="1.2" />
						<line x1="84" y1="21" x2="72" y2="28" stroke-width="1.2" />
						<!-- Side elevation view below record (playing time = 1 hour) -->
						<line x1="10" y1="114" x2="94" y2="114" stroke-width="2" />
						<path d="M 82 104 L 90 104 L 86 113 Z" stroke-width="1.2" />
						<text
							x="-10"
							y="132"
							fill="#DDB474"
							stroke="none"
							font-family="monospace"
							font-size="13.5"
						>
							t = 59.5 min
						</text>
					</g>

					<!-- ============================================================ -->
					<!-- 2. TOP-RIGHT: VIDEO WAVEFORM, SCANLINES & CALIBRATION CIRCLE -->
					<!-- ============================================================ -->
					<g transform="translate(262, 74)" stroke="#C89B57" fill="none" filter="url(#etchGlow)">
						<text
							x="-12"
							y="-12"
							fill="#E8E6E1"
							stroke="none"
							font-family="monospace"
							font-size="14.5"
						>
							II. VIDEO SCAN
						</text>
						<!-- Analog video waveform scanlines 1, 2, 3 -->
						<polyline
							points="0,20 8,20 8,32 14,32 14,12 22,22 30,10 38,24 46,16 54,20 62,20 62,32 68,32 68,14 78,24 88,12 96,20 104,20 104,32 110,32 110,16 122,20"
							stroke-width="1.3"
						/>
						<text x="0" y="48" fill="#DDB474" stroke="none" font-family="monospace" font-size="13.5">
							SCAN = 8.0 ms
						</text>

						<!-- Vertical Raster Grid & Calibration Circle (#1 Image) -->
						<g transform="translate(8, 56)">
							<!-- Raster scanlines -->
							{#each [0, 10, 20, 30, 40] as lx, idx}
								<line
									x1={lx}
									y1="2"
									x2={lx}
									y2="54"
									stroke-width="1.1"
									stroke-opacity={0.75}
								/>
								{#if idx < 4}
									<line
										x1={lx}
										y1="54"
										x2={lx + 10}
										y2="2"
										stroke-width="0.6"
										stroke-dasharray="2 2"
										stroke-opacity="0.5"
									/>
								{/if}
							{/each}
							<text
								x="-10"
								y="72"
								fill="#DDB474"
								stroke="none"
								font-family="monospace"
								font-size="13.5"
							>
								512 LINES · CIRCLE
							</text>

							<!-- First Reconstructed Frame: Circle -->
							<rect x="64" y="2" width="56" height="52" stroke-width="1.3" />
							<circle cx="92" cy="28" r="18" stroke-width="1.4" />
						</g>
					</g>

					<!-- ============================================================ -->
					<!-- 3. ELECTROPLATED URANIUM-238 RADIOMETRIC CLOCK SPOT          -->
					<!-- ============================================================ -->
					<g transform="translate(68, 214)">
						<rect
							x="0"
							y="0"
							width="162"
							height="38"
							rx="2"
							fill="#171105"
							stroke="#C89B57"
							stroke-width="1.1"
						/>
						<circle cx="14" cy="19" r="5.5" fill="#C89B57" />
						<circle cx="14" cy="19" r="2.2" fill="#171105" />
						<text
							x="26"
							y="16"
							fill="#E8E6E1"
							font-family="monospace"
							font-size="13.5"
						>
							²³⁸U CLOCK
						</text>
						<text x="26" y="32" fill="#C89B57" font-family="monospace" font-size="13.2">
							t½ = 4.47 Gyr
						</text>
					</g>

					<!-- ============================================================ -->
					<!-- 4. BOTTOM-LEFT: 14-PULSAR HELIOCENTRIC COORDINATE MAP        -->
					<!-- ============================================================ -->
					<g transform="translate(178, 344)">
						<text
							x="-110"
							y="-76"
							fill="#E8E6E1"
							font-family="monospace"
							font-size="14.5"
						>
							III. 14-PULSAR MAP
						</text>

						<!-- 15th Reference Axis (Solar System / Earth vector) -->
						<line
							x1="0"
							y1="0"
							x2="82"
							y2="0"
							stroke="rgba(232,230,225,0.45)"
							stroke-width="1.2"
							stroke-dasharray="3 2"
						/>
						<circle cx="82" cy="0" r="2.5" fill="#E8E6E1" />

						<!-- 14 Interactive Pulsar Rays -->
						{#each PULSARS as pulsar}
							{@const rad = (pulsar.angleDeg * Math.PI) / 180}
							{@const x2 = Math.cos(rad) * pulsar.lengthPx}
							{@const y2 = Math.sin(rad) * pulsar.lengthPx}
							{@const isSelected = selectedPulsar.id === pulsar.id}
							<g
								class="cursor-pointer"
								role="button"
								tabindex="0"
								aria-label={`Inspect pulsar ${pulsar.psr}`}
								onclick={() => selectPulsar(pulsar)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										selectPulsar(pulsar);
									}
								}}
							>
								<!-- Invisible wide hit target -->
								<line x1="0" y1="0" {x2} {y2} stroke="transparent" stroke-width="12" />
								<!-- Visible etched pulsar vector -->
								<line
									x1="0"
									y1="0"
									{x2}
									{y2}
									stroke={isSelected ? '#E8E6E1' : '#C89B57'}
									stroke-width={isSelected ? '2.4' : '1.3'}
									stroke-opacity={isSelected ? '1' : '0.82'}
								/>
								<!-- Binary tick marks along the pulsar ray -->
								{#each [0.28, 0.44, 0.6, 0.76, 0.9] as t, bIdx}
									{@const bx = x2 * t}
									{@const by = y2 * t}
									{@const px = -Math.sin(rad) * 3.5}
									{@const py = Math.cos(rad) * 3.5}
									{#if pulsar.binaryUnits[bIdx] === '1'}
										<line
											x1={bx - px}
											y1={by - py}
											x2={bx + px}
											y2={by + py}
											stroke={isSelected ? '#E8E6E1' : '#DDB474'}
											stroke-width="1.1"
										/>
									{/if}
								{/each}
								<!-- Pulsar tip node -->
								<circle
									cx={x2}
									cy={y2}
									r={isSelected ? '4.5' : '2.6'}
									fill={isSelected ? '#E8E6E1' : '#C89B57'}
								/>
							</g>
						{/each}

						<!-- Sun Origin Center -->
						<circle cx="0" cy="0" r="4.5" fill="#E8E6E1" stroke="#C89B57" stroke-width="1.5" />
					</g>

					<!-- ============================================================ -->
					<!-- 5. BOTTOM-RIGHT: HYDROGEN HYPERFINE SPIN-FLIP TRANSITION     -->
					<!-- ============================================================ -->
					<g transform="translate(310, 358)" stroke="#C89B57" fill="none" filter="url(#etchGlow)">
						<text
							x="-32"
							y="-32"
							fill="#E8E6E1"
							stroke="none"
							font-family="monospace"
							font-size="14.5"
						>
							IV. ¹H SPIN-FLIP
						</text>

						<!-- Left H atom: anti-parallel spins (lower energy state) -->
						<circle cx="20" cy="18" r="22" stroke-width="1.5" />
						<circle cx="20" cy="18" r="3" fill="#C89B57" />
						<!-- Proton spin up -->
						<line x1="20" y1="8" x2="20" y2="28" stroke-width="1.3" />
						<circle cx="20" cy="9" r="1.8" fill="#C89B57" />
						<!-- Electron on orbital shell spin down -->
						<line x1="42" y1="8" x2="42" y2="28" stroke-width="1.3" />
						<circle cx="42" cy="27" r="1.8" fill="#C89B57" />

						<!-- Connecting Horizontal Bar & Fundamental Binary Unit '1' -->
						<line x1="36" y1="46" x2="86" y2="46" stroke-width="1.4" />
						<line x1="61" y1="36" x2="61" y2="44" stroke-width="2" />

						<!-- Right H atom: parallel spins (higher energy state) -->
						<circle cx="102" cy="18" r="22" stroke-width="1.5" />
						<circle cx="102" cy="18" r="3" fill="#C89B57" />
						<!-- Proton spin up -->
						<line x1="102" y1="8" x2="102" y2="28" stroke-width="1.3" />
						<circle cx="102" cy="9" r="1.8" fill="#C89B57" />
						<!-- Electron spin up -->
						<line x1="124" y1="8" x2="124" y2="28" stroke-width="1.3" />
						<circle cx="124" cy="9" r="1.8" fill="#C89B57" />

						<text
							x="-32"
							y="68"
							fill="#DDB474"
							stroke="none"
							font-family="monospace"
							font-size="13.5"
						>
							1420 MHz · 21 cm
						</text>
					</g>
				</svg>
				</div>
			</div>

			<!-- Selected Pulsar Ray Telemetry Readout -->
			<div
				class="mt-3 w-full border border-[#E8E6E1]/12 bg-[#050607] p-3 sm:p-4"
			>
				<div class="flex flex-wrap items-center justify-between gap-2">
					<div class="flex items-center gap-2">
						<span
							class="inline-block h-1.5 w-1.5 rounded-full bg-[#C89B57]"
						></span>
						<span class="font-mono-tech text-xs tracking-[0.12em] text-[#E8E6E1]">
							SELECTED PULSAR RAY: {selectedPulsar.psr}
						</span>
						{#if selectedPulsar.commonName}
							<span
								class="border border-[#C89B57]/30 px-2 py-0.5 font-mono-tech text-[11px] text-[#C89B57]"
							>
								{selectedPulsar.commonName}
							</span>
						{/if}
					</div>
					<span class="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/60">
						DIST: <strong class="font-normal text-[#E8E6E1]">{selectedPulsar.distanceKpc}</strong>
					</span>
				</div>

				<div class="mt-2.5 grid grid-cols-2 gap-3 text-xs border-t border-[#E8E6E1]/10 pt-2.5">
					<div>
						<div class="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/50">
							ROTATION PERIOD &amp; ¹H UNITS
						</div>
						<div class="mt-0.5 font-mono-tech text-sm text-[#C89B57]">
							{selectedPulsar.periodSec.toFixed(7)} s
						</div>
						<div class="mt-0.5 font-mono-tech text-[11px] text-[#E8E6E1]/50">
							{selectedPulsar.hyperfineCount} × 0.704 ns spin-flips
						</div>
					</div>
					<div>
						<div class="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/50">
							ETCHED BINARY VECTOR ENCODING
						</div>
						<div
							class="mt-0.5 break-all font-mono-tech text-[11px] leading-tight tracking-wider text-[#E8E6E1]/85"
						>
							{selectedPulsar.binaryUnits}₂
						</div>
					</div>
				</div>
				<p class="mt-2.5 font-sans text-base text-[#E8E6E1]/75 leading-[1.55]">
					{selectedPulsar.notes}
				</p>
			</div>
		</div>

		<!-- RIGHT: Oscilloscope Canvas, Greeting / Music Selector & U-238 Decay Clock -->
		<div class="lg:col-span-6 flex flex-col gap-3.5 sm:gap-4">
			<!-- Oscilloscope & 512-Scanline Video Frame Canvas -->
			<div class="border border-[#E8E6E1]/12 bg-[#050607] p-3 sm:p-4">
				<div class="mb-2.5 flex flex-wrap items-center justify-between gap-2">
					<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
						OSCILLOSCOPE &amp; 115-FRAME ANALOG VIDEO RECONSTRUCTOR
					</span>
					<div class="flex flex-wrap gap-1.5">
						{#each [
							{ id: 'greetings', label: '55 Greetings' },
							{ id: 'music', label: '90m Music' },
							{ id: 'pulsar', label: 'Pulsar Train' },
							{ id: 'video-scan', label: 'Video Scan' }
						] as tab}
							<button
								type="button"
								onclick={() => switchMode(tab.id as SynthMode)}
								class="border px-2.5 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] transition-colors duration-500 cursor-pointer {activeMode ===
								tab.id
									? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
									: 'border-[#E8E6E1]/12 bg-transparent text-[#E8E6E1]/55 hover:text-[#E8E6E1]'}"
							>
								{tab.label}
							</button>
						{/each}
					</div>
				</div>

				<canvas
					bind:this={oscCanvas}
					width="600"
					height="190"
					class="w-full h-[120px] sm:h-[165px] border border-[#E8E6E1]/12 bg-[#050607]"
				></canvas>

				<!-- Analog Video Slide Selector -->
				<div class="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
					<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/55">DECODED VIDEO SLIDE:</span>
					<div class="flex flex-wrap gap-1.5">
						{#each [
							{ id: 'circle', label: '#1 Calibration Circle' },
							{ id: 'solar-map', label: '#2 Solar Location Map' },
							{ id: 'dna', label: '#12 DNA Helix' },
							{ id: 'humans', label: '#38 Human Couple' }
						] as slide}
							<button
								type="button"
								onclick={() => {
									selectedVideoSlide = slide.id as VideoImageId;
									scanlineProgress = 40;
								}}
								class="border px-2 py-0.5 font-mono-tech text-[11px] uppercase tracking-[0.12em] transition-colors duration-500 cursor-pointer {selectedVideoSlide ===
								slide.id
									? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
									: 'border-[#E8E6E1]/12 bg-transparent text-[#E8E6E1]/55 hover:text-[#E8E6E1]'}"
							>
								{slide.label}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Verified Greetings Browser (55 Languages of Earth) -->
			<div class="border border-[#E8E6E1]/12 bg-[#050607] p-3 sm:p-4">
				<div class="flex items-center justify-between">
					<h5 class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
						VERIFIED GREETINGS IN 55 LANGUAGES (SIDE 1, TRACK 1)
					</h5>
					<span class="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/44">
						SELECT CADENCE
					</span>
				</div>

				<div class="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
					{#each GREETINGS as g}
						<button
							type="button"
							onclick={() => {
								selectedGreeting = g;
								switchMode('greetings');
							}}
							class="border px-1.5 py-1.5 text-center font-mono-tech text-[11px] whitespace-nowrap transition-colors duration-500 cursor-pointer {selectedGreeting.id ===
							g.id
								? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
								: 'border-[#E8E6E1]/12 bg-transparent text-[#E8E6E1]/72 hover:border-[#E8E6E1]/30 hover:text-[#E8E6E1]'}"
						>
							{g.language}
						</button>
					{/each}
				</div>

				<div class="mt-2.5 border-t border-[#E8E6E1]/10 pt-2.5">
					<div class="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tech">
						<span class="text-[#C89B57]">
							{selectedGreeting.language} — {selectedGreeting.eraOrRegion}
						</span>
						<span class="text-[#E8E6E1]/55">Speaker: {selectedGreeting.speaker}</span>
					</div>
					{#if selectedGreeting.nativeScript !== selectedGreeting.translation}
						<p class="mt-1.5 font-sans text-base text-[#E8E6E1]">
							{selectedGreeting.nativeScript}
						</p>
					{/if}
					<p class="mt-1 font-display italic text-base text-[#E8E6E1]/75">
						“{selectedGreeting.translation}”
					</p>
				</div>
			</div>

			<!-- Verified 90-Minute Musical Selections Browser -->
			<div class="border border-[#E8E6E1]/12 bg-[#050607] p-3 sm:p-4">
				<div class="flex items-center justify-between">
					<h5 class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#E8E6E1]/80">
						90-MINUTE MUSICAL ARCHIVE OF EARTH
					</h5>
					<span class="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/44">27 MASTERWORKS</span>
				</div>

				<div class="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
					{#each MUSIC_TRACKS as track}
						<button
							type="button"
							onclick={() => {
								selectedTrack = track;
								switchMode('music');
							}}
							class="border px-2.5 py-2 text-left transition-colors duration-500 cursor-pointer {selectedTrack.id ===
							track.id
								? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
								: 'border-[#E8E6E1]/12 bg-transparent text-[#E8E6E1]/72 hover:border-[#E8E6E1]/30 hover:text-[#E8E6E1]'}"
						>
							<div class="font-mono-tech text-[11px] leading-snug">
								{track.composerOrArtist.split('(')[0].trim()}
							</div>
							<div class="mt-0.5 text-[11px] leading-snug text-[#E8E6E1]/58">{track.title}</div>
						</button>
					{/each}
				</div>

				<div class="mt-2.5 border-t border-[#E8E6E1]/10 pt-2.5">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="font-display text-base text-[#E8E6E1]">{selectedTrack.title}</span>
						<span class="font-mono-tech text-xs text-[#C89B57]">{selectedTrack.duration}</span>
					</div>
					<div class="mt-0.5 font-mono-tech text-[11px] text-[#E8E6E1]/55">
						{selectedTrack.performer} · {selectedTrack.origin}
					</div>
					<p class="mt-1.5 font-sans text-base text-[#E8E6E1]/75 leading-[1.55]">
						{selectedTrack.significance}
					</p>
				</div>
			</div>

			<!-- Electroplated Uranium-238 Radiometric Decay Clock Simulator -->
			<div class="border border-[#E8E6E1]/12 bg-[#050607] p-3 sm:p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<span class="font-mono-tech text-[11px] uppercase tracking-[0.16em] text-[#C89B57]">
						²³⁸U → ²⁰⁶Pb RADIOMETRIC CHRONOMETER (t½ = 4.468 Gyr)
					</span>
					<span class="font-mono-tech text-[11px] text-[#E8E6E1]">
						T + {uraniumElapsedGyr < 0.01 ? '49 Years (2026)' : `${uraniumElapsedGyr.toFixed(2)} Billion Years`}
					</span>
				</div>
				<input
					type="range"
					min="0"
					max="9"
					step="0.05"
					bind:value={uraniumElapsedGyr}
					aria-label="Simulated billions of years elapsed since 1977 launch"
					class="mt-2.5 w-full accent-[#C89B57] cursor-pointer"
				/>
				<div class="mt-1.5 flex items-center justify-between font-mono-tech text-[11px]">
					<span class="text-[#C89B57]">
						²³⁸U Remaining: {(u238RemainingFraction * 100).toFixed(2)}%
					</span>
					<span class="text-[#E8E6E1]/44">1977 Launch → 9.0 Gyr Future</span>
					<span class="text-[#E8E6E1]/80">
						²⁰⁶Pb Daughter: {(pb206AccumulatedFraction * 100).toFixed(2)}%
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
