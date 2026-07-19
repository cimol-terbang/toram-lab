<script>
	import favicon from '$lib/assets/logo.png';
	import { Footer, MyBuildsModal, Modal } from '$lib/components';
	import { Crosshair, BookOpen, Sword } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { activeBuild } from '$lib/stores/buildStore.js';
	import { computeCharacterStats } from '$lib/application/character-stat.js';
	import AllStatsList from '$lib/components/AllStatsList.svelte';
	let { children } = $props();

	let showBuilds = $state(false);
	let showStats = $state(false);

	let build = $derived($activeBuild);
	let s = $derived(computeCharacterStats(build));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Exo+2:wght@300;400;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<nav class="minibar">
	<div class="minibar-inner">
		<a
			href="/"
			class="minibar-brand"
			onclick={(e) => { e.preventDefault(); goto('/'); }}
		>
			<Sword size={17} class="brand-icon" />
			<span class="brand-text">TORAM LAB</span>
		</a>
		<div class="minibar-right">
			<button
				class="mini-btn builds-btn"
				onclick={() => { showBuilds = true; }}
				title="My Builds"
			>
				<BookOpen size={16} />
				<span class="mini-btn-label">BUILDS</span>
			</button>
			<div class="mini-divider"></div>
			<button
				class="mini-btn stats-btn"
				onclick={() => { showStats = true; }}
				title="Live Build Stats"
			>
				<Crosshair size={16} />
				<span class="mini-btn-label">STATS</span>
			</button>
		</div>
	</div>
</nav>

<main class="layout-main">
	{@render children()}
</main>

<Footer />

<MyBuildsModal
	open={showBuilds}
	onclose={() => { showBuilds = false; }}
/>

<Modal
	title="All Stats"
	open={showStats}
	onclose={() => { showStats = false; }}
>
	<div class="stats-modal-scroll">
		<AllStatsList total={s} showAll={true} />
	</div>
</Modal>

<style>
	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(:root) {
		--bg-deep: #080c14;
		--bg-panel: #0f1626;
		--bg-card: #141e35;
		--bg-hover: #1a2845;
		--border: #2a3a5c;
		--border-glow: #3d5a8a;
		--gold: #f4c542;
		--gold-dim: #a88820;
		--crimson: #e63946;
		--teal: #4cc9a0;
		--teal-dim: #2a7a62;
		--purple: #9b72cf;
		--blue: #4a9eff;
		--text-bright: #f0e6d3;
		--text-mid: #a8b8d4;
		--text-dim: #5a6a84;
		--pixel: 'Press Start 2P', monospace;
		--body: 'Exo 2', sans-serif;
	}

	:global(body) {
		background: var(--bg-deep);
		color: var(--text-bright);
		font-family: var(--body);
		min-height: 100vh;
		overflow-x: hidden;
	}

	:global(::-webkit-scrollbar) {
		width: 6px;
		height: 6px;
	}
	:global(::-webkit-scrollbar-track) {
		background: var(--bg-panel);
	}
	:global(::-webkit-scrollbar-thumb) {
		background: var(--border-glow);
		border-radius: 3px;
	}
	:global(::-webkit-scrollbar-thumb:hover) {
		background: var(--blue);
	}

	:global(input[type='number'],
	input[type='text'],
	input[type='search'],
	select) {
		background: var(--bg-deep);
		border: 1px solid var(--border);
		color: var(--text-bright);
		font-family: var(--body);
		font-size: 13px;
		padding: 6px 10px;
		border-radius: 4px;
		outline: none;
		transition: border-color 0.2s;
		width: 100%;
	}

	:global(input[type='number']:focus,
	input[type='text']:focus,
	input[type='search']:focus,
	select:focus) {
		border-color: var(--blue);
		box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.15);
	}

	:global(select) {
		cursor: pointer;
	}

	:global(select option) {
		background: var(--bg-card);
	}

	:global(button) {
		cursor: pointer;
		font-family: var(--body);
	}

	/* ─── MINIBAR ─── */
	.minibar {
		position: sticky;
		top: 0;
		z-index: 500;
		background: rgba(8, 12, 20, 0.88);
		backdrop-filter: blur(16px) saturate(1.4);
		border-bottom: 1px solid rgba(42, 58, 92, 0.7);
		box-shadow:
			0 1px 0 rgba(74, 158, 255, 0.06),
			0 4px 24px rgba(0, 0, 0, 0.35);
	}
	.minibar-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.25rem;
		height: 56px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.minibar-brand {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		text-decoration: none;
		flex-shrink: 0;
	}
	.minibar-brand :global(.brand-icon) {
		color: var(--gold);
		filter: drop-shadow(0 0 8px rgba(244, 197, 66, 0.5));
	}
	.brand-text {
		font-family: var(--pixel);
		font-size: 0.68rem;
		color: var(--gold);
		letter-spacing: 0.1em;
	}
	.minibar-right {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		margin-left: auto;
	}
	.mini-divider {
		width: 1px;
		height: 20px;
		background: var(--border);
		opacity: 0.5;
	}
	.mini-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		background: none;
		border: 1px solid transparent;
		color: var(--text-mid);
		padding: 5px 8px;
		border-radius: 5px;
		cursor: pointer;
		transition: all 0.18s;
	}
	.mini-btn:hover {
		border-color: var(--border);
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-bright);
	}
	.mini-btn-label {
		font-family: var(--pixel);
		font-size: 0.42rem;
		letter-spacing: 0.06em;
		color: inherit;
	}
	.builds-btn:hover {
		color: var(--gold);
		border-color: rgba(244, 197, 66, 0.3);
		background: rgba(244, 197, 66, 0.06);
	}
	.stats-btn:hover {
		color: var(--teal);
		border-color: rgba(76, 201, 160, 0.3);
		background: rgba(76, 201, 160, 0.06);
	}

	/* ─── STATS MODAL ─── */
	.stats-modal-scroll {
		max-height: 70vh;
		overflow-y: auto;
	}

	.layout-main {
		display: flex;
		flex-direction: column;
		min-height: calc(100vh - 56px);
	}
</style>
