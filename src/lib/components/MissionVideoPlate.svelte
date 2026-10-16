<script lang="ts">
	import { onMount } from 'svelte';
	import type { VideoManifestEntry } from '$lib/data/assets';

	interface Props {
		videos: VideoManifestEntry[];
	}

	let { videos }: Props = $props();

	let activeIndex = $state(0);
	const currentVideo = $derived(videos[activeIndex] ?? videos[0]);

	let containerEl: HTMLElement | undefined = $state();
	let isNearViewport = $state(false);
	let isMobileViewport = $state(true);
	let userActivated = $state<Record<string, boolean>>({});
	let ambientMuted = $state(true);
	let ambientPaused = $state(false);
	let videoEl: HTMLVideoElement | undefined = $state();

	function selectClip(idx: number) {
		activeIndex = idx;
		ambientPaused = false;
	}

	function activatePlayback(id: string) {
		userActivated = { ...userActivated, [id]: true };
	}

	function toggleAmbientMute() {
		ambientMuted = !ambientMuted;
		if (videoEl) {
			videoEl.muted = ambientMuted;
		}
	}

	function toggleAmbientPause() {
		if (!videoEl) return;
		if (videoEl.paused) {
			videoEl.play().catch(() => {});
			ambientPaused = false;
		} else {
			videoEl.pause();
			ambientPaused = true;
		}
	}

	onMount(() => {
		isMobileViewport = window.innerWidth < 768;
		const onResize = () => {
			isMobileViewport = window.innerWidth < 768;
		};
		window.addEventListener('resize', onResize, { passive: true });

		if (!containerEl) {
			return () => window.removeEventListener('resize', onResize);
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						isNearViewport = true;
					} else if (videoEl && !videoEl.paused && currentVideo?.behavior === 'ambient-loop') {
						videoEl.pause();
					} else if (
						entry.isIntersecting &&
						videoEl &&
						videoEl.paused &&
						!ambientPaused &&
						currentVideo?.behavior === 'ambient-loop' &&
						!isMobileViewport
					) {
						videoEl.play().catch(() => {});
					}
				}
			},
			{ rootMargin: '160px 0px', threshold: 0.05 }
		);
		observer.observe(containerEl);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', onResize);
		};
	});
</script>

{#if currentVideo}
	{@const isActivated = !!userActivated[currentVideo.id]}
	{@const shouldAutoplayAmbient =
		currentVideo.kind === 'self-hosted' &&
		currentVideo.behavior === 'ambient-loop' &&
		!isMobileViewport &&
		isNearViewport}

	<div
		bind:this={containerEl}
		class="my-5 md:my-8 border border-[#E8E6E1]/14 bg-[#050607]"
		data-video-plate={currentVideo.id}
		data-video-kind={currentVideo.kind}
	>
		<!-- Top Hairline Bar: Mode Label & Optional Multi-Clip Switcher -->
		<div
			class="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E6E1]/12 px-3.5 py-2 sm:px-5"
		>
			<div class="flex items-center gap-2.5 font-mono-tech text-xs uppercase tracking-[0.16em]">
				<span class="h-1.5 w-1.5 rounded-full bg-[#C89B57]"></span>
				{#if currentVideo.kind === 'youtube-embed'}
					<span class="text-[#C89B57]">WATCH THE MOMENT · SPACEX</span>
				{:else if currentVideo.behavior === 'ambient-loop'}
					<span class="text-[#C89B57]">ARCHIVAL TELEMETRY LOOP · {currentVideo.archiveId}</span>
				{:else}
					<span class="text-[#C89B57]">ARCHIVAL MISSION FOOTAGE · {currentVideo.archiveId}</span>
				{/if}
			</div>

			{#if videos.length > 1}
				<div class="flex flex-wrap items-center gap-1.5">
					{#each videos as clip, idx (clip.id)}
						<button
							type="button"
							onclick={() => selectClip(idx)}
							class="border px-2.5 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] transition-colors duration-300 cursor-pointer {activeIndex ===
							idx
								? 'border-[#C89B57] bg-[#C89B57]/15 text-[#E8E6E1]'
								: 'border-[#E8E6E1]/14 bg-transparent text-[#E8E6E1]/60 hover:text-[#E8E6E1]'}"
						>
							{clip.shortTabLabel ?? `Clip 0${idx + 1}`}
						</button>
					{/each}
				</div>
			{:else}
				<span class="font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/50">
					{currentVideo.eventDate}
				</span>
			{/if}
		</div>

		<!-- Main Video / Lite-Embed Stage (16:9 Aspect Frame) -->
		<div class="relative aspect-video w-full overflow-hidden bg-[#050607]">
			{#if currentVideo.kind === 'youtube-embed'}
				{#if isActivated && currentVideo.embeddable !== false}
					<iframe
						src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
						title={currentVideo.title}
						class="h-full w-full border-0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
					></iframe>
				{:else if currentVideo.embeddable === false}
					<!-- Fallback Linked Thumbnail Card when embedding is disabled -->
					<a
						href={currentVideo.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="group relative block h-full w-full text-left focus:outline-none"
					>
						<img
							src={currentVideo.posterUrl}
							alt={currentVideo.title}
							loading="lazy"
							decoding="async"
							class="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
							style="filter: saturate(0.82) contrast(1.08) brightness(0.78);"
						/>
						<div
							class="absolute inset-0"
							style="background: linear-gradient(180deg, rgba(5,6,7,0.28) 0%, rgba(5,6,7,0.48) 55%, rgba(5,6,7,0.88) 100%);"
						></div>
						<div class="absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
							<div class="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#C89B57]">
								WATCH THE MOMENT · SPACEX (OPENS YOUTUBE ↗)
							</div>
							<div class="flex items-end justify-between gap-4">
								<div>
									<h4 class="font-display text-lg sm:text-2xl font-normal text-[#F2F0EC] leading-snug">
										{currentVideo.title}
									</h4>
									<p class="mt-1 font-mono-tech text-[11px] uppercase tracking-[0.14em] text-[#E8E6E1]/72">
										{currentVideo.missionName} · {currentVideo.eventDate}
									</p>
								</div>
								<span
									class="flex h-12 w-12 shrink-0 items-center justify-center border border-[#C89B57] bg-[#050607]/85 text-[#C89B57] transition-colors duration-300 group-hover:bg-[#C89B57] group-hover:text-[#050607]"
								>
									↗
								</span>
							</div>
						</div>
					</a>
				{:else}
					<!-- Privacy-Enhanced YouTube Lite-Embed Facade (Zero iframe until click) -->
					<button
						type="button"
						onclick={() => activatePlayback(currentVideo.id)}
						aria-label={`Play video: ${currentVideo.title}`}
						data-testid={`yt-facade-${currentVideo.id}`}
						class="group relative block h-full w-full cursor-pointer text-left focus:outline-none"
					>
						<img
							src={currentVideo.posterUrl}
							alt={currentVideo.title}
							loading="lazy"
							decoding="async"
							class="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
							style="filter: saturate(0.82) contrast(1.08) brightness(0.78);"
						/>
						<div
							class="pointer-events-none absolute inset-0"
							style="background: radial-gradient(circle at 50% 50%, rgba(5,6,7,0.18) 0%, rgba(5,6,7,0.68) 100%), linear-gradient(180deg, rgba(5,6,7,0.25) 0%, rgba(5,6,7,0.35) 50%, rgba(5,6,7,0.88) 100%);"
						></div>

						<!-- Center Play Glyph -->
						<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span
								class="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center border border-[#C89B57] bg-[#050607]/85 text-[#C89B57] transition-all duration-300 group-hover:scale-105 group-hover:bg-[#C89B57] group-hover:text-[#050607]"
							>
								<svg viewBox="0 0 24 24" class="h-6 w-6 fill-current ml-0.5" aria-hidden="true">
									<polygon points="6,4 20,12 6,20" />
								</svg>
							</span>
						</div>

						<!-- Bottom Editorial Overlay: Thin Mono Eyebrow + Serif Title -->
						<div class="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-6">
							<div class="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#DDB474]">
								WATCH THE MOMENT · SPACEX
							</div>
							<h4
								class="mt-1 font-display text-lg sm:text-2xl font-normal text-[#F5F3EE] leading-snug"
								style="text-shadow: 0 2px 18px rgba(5,6,7,0.95);"
							>
								{currentVideo.title}
							</h4>
						</div>
					</button>
				{/if}
			{:else if shouldAutoplayAmbient || isActivated}
				<!-- Self-Hosted Public-Domain Video Player (Muted Ambient Loop OR Click-to-Play Event Clip) -->
				<video
					bind:this={videoEl}
					poster={currentVideo.posterUrl}
					preload="metadata"
					autoplay
					loop={currentVideo.behavior === 'ambient-loop'}
					muted={currentVideo.behavior === 'ambient-loop' ? ambientMuted : false}
					controls={isActivated || currentVideo.behavior === 'click-to-play'}
					playsinline
					class="h-full w-full object-cover object-center"
					style="filter: saturate(0.84) contrast(1.06);"
				>
					{#if currentVideo.webmUrl}
						<source src={currentVideo.webmUrl} type="video/webm" />
					{/if}
					{#if currentVideo.mp4Url}
						<source src={currentVideo.mp4Url} type="video/mp4" />
					{/if}
				</video>

				{#if currentVideo.behavior === 'ambient-loop' && !isActivated}
					<!-- Quiet Ambient Loop Controls Overlay -->
					<div
						class="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5 sm:p-5"
						style="background: linear-gradient(180deg, rgba(5,6,7,0) 0%, rgba(5,6,7,0.82) 100%);"
					>
						<div>
							<div class="font-mono-tech text-xs uppercase tracking-[0.16em] text-[#DDB474]">
								AMBIENT ARCHIVAL LOOP · MUTED
							</div>
							<h4 class="mt-0.5 font-display text-base sm:text-xl font-normal text-[#F5F3EE] leading-snug">
								{currentVideo.title}
							</h4>
						</div>
						<div class="pointer-events-auto flex items-center gap-2">
							<button
								type="button"
								onclick={toggleAmbientPause}
								class="border border-[#E8E6E1]/25 bg-[#050607]/85 px-2.5 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#E8E6E1] hover:border-[#C89B57] hover:text-[#C89B57] cursor-pointer"
							>
								{ambientPaused ? 'PLAY' : 'PAUSE'}
							</button>
							{#if currentVideo.hasAudio}
								<button
									type="button"
									onclick={toggleAmbientMute}
									class="border border-[#C89B57]/60 bg-[#050607]/85 px-2.5 py-1 font-mono-tech text-xs uppercase tracking-[0.14em] text-[#C89B57] hover:bg-[#C89B57]/20 cursor-pointer"
								>
									{ambientMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}
								</button>
							{/if}
						</div>
					</div>
				{/if}
			{:else}
				<!-- Self-Hosted Click-to-Play Facade (and Mobile Zero-Preload Tap-to-Play Facade) -->
				<button
					type="button"
					onclick={() => activatePlayback(currentVideo.id)}
					aria-label={`Play archival footage: ${currentVideo.title}`}
					data-testid={`self-video-facade-${currentVideo.id}`}
					class="group relative block h-full w-full cursor-pointer text-left focus:outline-none"
				>
					<img
						src={currentVideo.posterUrl}
						alt={currentVideo.title}
						loading="lazy"
						decoding="async"
						class="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
						style="filter: saturate(0.84) contrast(1.06) brightness(0.84);"
					/>
					<div
						class="pointer-events-none absolute inset-0"
						style="background: radial-gradient(circle at 50% 50%, rgba(5,6,7,0.14) 0%, rgba(5,6,7,0.64) 100%), linear-gradient(180deg, rgba(5,6,7,0.20) 0%, rgba(5,6,7,0.32) 50%, rgba(5,6,7,0.88) 100%);"
					></div>

					<!-- Center Play Glyph -->
					<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
						<span
							class="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center border border-[#C89B57] bg-[#050607]/85 text-[#C89B57] transition-all duration-300 group-hover:scale-105 group-hover:bg-[#C89B57] group-hover:text-[#050607]"
						>
							<svg viewBox="0 0 24 24" class="h-6 w-6 fill-current ml-0.5" aria-hidden="true">
								<polygon points="6,4 20,12 6,20" />
							</svg>
						</span>
					</div>

					<!-- Bottom Editorial Overlay -->
					<div class="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-6">
						<div class="font-mono-tech text-xs uppercase tracking-[0.18em] text-[#DDB474]">
							{currentVideo.hasAudio ? 'CLICK TO PLAY WITH AUDIO' : 'CLICK TO PLAY ARCHIVAL FOOTAGE'} · {currentVideo.durationLabel}
						</div>
						<h4
							class="mt-1 font-display text-lg sm:text-2xl font-normal text-[#F5F3EE] leading-snug"
							style="text-shadow: 0 2px 18px rgba(5,6,7,0.95);"
						>
							{currentVideo.title}
						</h4>
					</div>
				</button>
			{/if}
		</div>

		<!-- Bottom Telemetry & Attribution Caption Bar -->
		<div
			class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-[#E8E6E1]/12 px-3.5 py-2.5 sm:px-5 font-mono-tech text-[11px] uppercase tracking-[0.14em]"
		>
			<div class="text-[#E8E6E1]/75 leading-snug">
				<span class="text-[#C89B57]">{currentVideo.missionName}</span>
				<span class="mx-1.5 text-[#E8E6E1]/35">·</span>
				<span>{currentVideo.eventDate}</span>
				<span class="mx-1.5 text-[#E8E6E1]/35">·</span>
				<span class="text-[#E8E6E1]/68">{currentVideo.creditLine}</span>
			</div>
			<a
				href={currentVideo.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1 text-[#C89B57] hover:text-[#DDB474] shrink-0 transition-colors"
			>
				<span>{currentVideo.kind === 'youtube-embed' ? 'YouTube (SpaceX)' : currentVideo.archiveName}</span>
				<span aria-hidden="true">↗</span>
			</a>
		</div>
	</div>
{/if}
