<script>
	import { onMount } from 'svelte';
	import {
		ScrollText,
		Search,
		Package,
		Gem,
		Sword,
		Shield,
		Star,
		Plus,
		Shirt
	} from '@lucide/svelte';
	import { loadJson } from '$lib/utils/lazyJson.js';
	import { adaptItem, getStatEntries } from '$lib/utils/item-adapter.js';

	const CATEGORIES = ['All', 'Weapon', 'Armor', 'Additional', 'Special', 'Crysta', 'Material'];
	let activeCategory = $state('All');
	let searchQuery = $state('');
	let allItems = $state([]);
	let loading = $state(true);
	let page = $state(0);
	const PAGE_SIZE = 40;

	onMount(async () => {
		try {
			allItems = await loadJson('items');
		} finally {
			loading = false;
		}
	});

	const WEAPON_TYPES = [
		'1 Handed Sword',
		'2 Handed Sword',
		'Bow',
		'Bowgun',
		'Staff',
		'Magic Device',
		'Knuckles',
		'Halberd',
		'Katana'
	];
	const ARMOR_TYPES = ['Armor'];
	const ADDITIONAL_TYPES = ['Additional'];
	const SPECIAL_TYPES = ['Special'];
	const CRYSTA_TYPES_PARTIAL = ['Crysta'];

	function matchCategory(item) {
		if (activeCategory === 'All') return true;
		if (activeCategory === 'Weapon') return WEAPON_TYPES.includes(item.type);
		if (activeCategory === 'Armor') return ARMOR_TYPES.includes(item.type);
		if (activeCategory === 'Additional') return ADDITIONAL_TYPES.includes(item.type);
		if (activeCategory === 'Special') return SPECIAL_TYPES.includes(item.type);
		if (activeCategory === 'Crysta') return item.type?.includes('Crysta');
		return true;
	}

	let filtered = $derived(
		allItems.filter((i) => {
			const catMatch = matchCategory(i);
			const searchMatch = !searchQuery || i.name?.toLowerCase().includes(searchQuery.toLowerCase());
			return catMatch && searchMatch;
		})
	);

	let pageItems = $derived(filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
	let totalPages = $derived(Math.ceil(filtered.length / PAGE_SIZE));

	function setCategory(cat) {
		activeCategory = cat;
		page = 0;
	}
	function onSearch() {
		page = 0;
	}

	const TYPE_ICON = { Sword, Shield, Shirt, Plus, Star, Gem };
	function getIcon(type) {
		if (WEAPON_TYPES.includes(type)) return Sword;
		if (type === 'Armor') return Shirt;
		if (type === 'Additional') return Plus;
		if (type === 'Special') return Star;
		if (type?.includes('Crysta')) return Gem;
		return Package;
	}
</script>

<svelte:head><title>Item Database — Toram Lab</title></svelte:head>

<div class="page">
	<div class="page-header">
		<div class="page-title-row">
			<ScrollText size={22} class="page-title-icon" />
			<div>
				<h1 class="page-title">ITEM DATABASE</h1>
				<p class="page-subtitle">Search all weapons, armors, accessories, and crystas</p>
			</div>
		</div>
	</div>

	<div class="controls">
		<div class="search-wrap">
			<Search size={14} class="search-icon" />
			<input
				type="search"
				class="search-input"
				placeholder="Search items..."
				bind:value={searchQuery}
				oninput={onSearch}
			/>
		</div>
		<div class="cat-tabs">
			{#each CATEGORIES as cat}
				<button
					class="cat-tab {activeCategory === cat ? 'active' : ''}"
					onclick={() => setCategory(cat)}>{cat}</button
				>
			{/each}
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<span>Loading database...</span>
		</div>
	{:else}
		<div class="result-bar">
			<span class="result-count">{filtered.length} items</span>
			{#if totalPages > 1}
				<div class="pagination-mini">
					<button class="pg-btn" disabled={page === 0} onclick={() => page--}>‹</button>
					<span>{page + 1}/{totalPages}</span>
					<button class="pg-btn" disabled={page >= totalPages - 1} onclick={() => page++}>›</button>
				</div>
			{/if}
		</div>

		<div class="items-grid">
			{#each pageItems as raw (raw.id ?? raw.name)}
				{@const adapted = adaptItem(raw)}
				{@const entries = getStatEntries(adapted)}
				{@const Icon = getIcon(raw.type)}
				<div class="item-card">
					<div class="item-header">
						<div class="item-icon-wrap"><Icon size={15} /></div>
						<div class="item-info">
							<span class="item-name">{raw.name}</span>
							<span class="item-type">{raw.type}</span>
						</div>
					</div>
					{#if entries.length}
						<div class="item-stats">
							{#each entries.slice(0, 5) as [k, v]}
								<div class="stat-row">
									<span class="stat-k">{k}</span>
									<span class="stat-v" class:pos={v > 0} class:neg={v < 0}
										>{v > 0 ? '+' : ''}{v}</span
									>
								</div>
							{/each}
							{#if entries.length > 5}<span class="more-stats"
									>+{entries.length - 5} more stats</span
								>{/if}
						</div>
					{:else}
						<p class="no-stats">No stat data</p>
					{/if}
				</div>
			{/each}
		</div>

		{#if pageItems.length === 0}
			<div class="empty-state">
				<Package size={36} class="empty-icon" />
				<p>No items found.</p>
			</div>
		{/if}
	{/if}
</div>

<style>
	.page {
		max-width: 1080px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 4rem;
	}
	.page-header {
		margin-bottom: 1.5rem;
	}
	.page-title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
	}
	.page-title-row :global(svg) {
		color: var(--purple);
		margin-top: 4px;
		flex-shrink: 0;
		filter: drop-shadow(0 0 6px rgba(155, 114, 207, 0.4));
	}
	.page-title {
		font-family: var(--pixel);
		font-size: clamp(0.65rem, 2.5vw, 0.95rem);
		color: var(--purple);
		letter-spacing: 0.06em;
	}
	.page-subtitle {
		font-size: 0.78rem;
		color: var(--text-dim);
		margin-top: 0.3rem;
	}
	.controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.search-wrap {
		position: relative;
		max-width: 380px;
	}
	.search-wrap :global(.search-icon) {
		position: absolute;
		left: 0.65rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-dim);
		pointer-events: none;
	}
	.search-input {
		padding-left: 2.1rem !important;
	}
	.cat-tabs {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.cat-tab {
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.02);
		color: var(--text-dim);
		font-size: 0.73rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.cat-tab:hover {
		border-color: var(--border-glow);
		color: var(--text-bright);
	}
	.cat-tab.active {
		border-color: rgba(155, 114, 207, 0.5);
		background: rgba(155, 114, 207, 0.08);
		color: var(--purple);
	}
	.loading-state {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 4rem;
		justify-content: center;
		color: var(--text-dim);
	}
	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border);
		border-top-color: var(--purple);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.result-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}
	.result-count {
		font-size: 0.7rem;
		color: var(--text-dim);
	}
	.pagination-mini {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	.pg-btn {
		width: 26px;
		height: 26px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 5px;
		color: var(--text-mid);
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.15s;
	}
	.pg-btn:hover:not(:disabled) {
		border-color: var(--purple);
		color: var(--purple);
	}
	.pg-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.6rem;
	}
	.item-card {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 9px;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: border-color 0.2s;
	}
	.item-card:hover {
		border-color: rgba(155, 114, 207, 0.35);
	}
	.item-header {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
	}
	.item-icon-wrap {
		width: 30px;
		height: 30px;
		border-radius: 6px;
		background: rgba(155, 114, 207, 0.07);
		border: 1px solid rgba(155, 114, 207, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--purple);
		flex-shrink: 0;
	}
	.item-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		flex: 1;
		min-width: 0;
	}
	.item-name {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-bright);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.item-type {
		font-size: 0.6rem;
		color: var(--text-dim);
	}
	.item-stats {
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
	}
	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.stat-k {
		font-size: 0.65rem;
		color: var(--text-mid);
	}
	.stat-v {
		font-size: 0.68rem;
		font-weight: 700;
		color: var(--text-bright);
	}
	.stat-v.pos {
		color: var(--teal);
	}
	.stat-v.neg {
		color: var(--crimson);
	}
	.more-stats {
		font-size: 0.6rem;
		color: var(--text-dim);
		margin-top: 0.1rem;
	}
	.no-stats {
		font-size: 0.65rem;
		color: var(--text-dim);
		font-style: italic;
	}
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 4rem;
		color: var(--text-dim);
		font-size: 0.82rem;
	}
	.empty-state :global(.empty-icon) {
		opacity: 0.3;
	}
</style>
