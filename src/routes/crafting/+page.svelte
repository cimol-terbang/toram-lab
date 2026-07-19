<script>
	import { Anvil, Search, Filter, ChevronDown, Package, Gem, Wrench } from '@lucide/svelte';

	const CATEGORIES = ['All', 'Weapon', 'Armor', 'Additional', 'Special', 'Material', 'Consumable'];
	let activeCategory = $state('All');
	let searchQuery = $state('');

	// Sample crafting data - expandable later
	const CRAFTING_LIST = [
		{
			name: 'Ortlinde',
			type: 'Weapon',
			category: 'Weapon',
			npc: 'Blacksmith',
			materials: [
				{ name: 'Yggdrasil Branch', qty: 5 },
				{ name: 'Fire Stone', qty: 3 },
				{ name: 'Spina', qty: 50000 }
			]
		},
		{
			name: 'Shadow Veil',
			type: 'Armor',
			category: 'Armor',
			npc: 'Blacksmith',
			materials: [
				{ name: 'Dark Cloth', qty: 8 },
				{ name: 'Shadow Fragment', qty: 4 },
				{ name: 'Spina', qty: 80000 }
			]
		},
		{
			name: 'Ring of Wisdom',
			type: 'Additional',
			category: 'Additional',
			npc: 'Synthesis',
			materials: [
				{ name: 'Magic Crystal', qty: 6 },
				{ name: 'Mana Stone', qty: 3 },
				{ name: 'Spina', qty: 30000 }
			]
		},
		{
			name: 'Brave Amulet',
			type: 'Special',
			category: 'Special',
			npc: 'Synthesis',
			materials: [
				{ name: 'Brave Heart', qty: 2 },
				{ name: 'Holy Water', qty: 5 },
				{ name: 'Spina', qty: 25000 }
			]
		},
		{
			name: 'HP Potion III',
			type: 'Consumable',
			category: 'Consumable',
			npc: 'Synthesis',
			materials: [
				{ name: 'Herb', qty: 10 },
				{ name: 'Water', qty: 5 }
			]
		},
		{
			name: 'MP Potion III',
			type: 'Consumable',
			category: 'Consumable',
			npc: 'Synthesis',
			materials: [
				{ name: 'Blue Herb', qty: 10 },
				{ name: 'Water', qty: 5 }
			]
		}
	];

	let filtered = $derived(
		CRAFTING_LIST.filter((item) => {
			const catMatch = activeCategory === 'All' || item.category === activeCategory;
			const searchMatch =
				!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
			return catMatch && searchMatch;
		})
	);

	const NPC_COLOR = { Blacksmith: 'var(--gold)', Synthesis: 'var(--purple)' };
</script>

<svelte:head><title>Crafting List — Toram Lab</title></svelte:head>

<div class="page">
	<div class="page-header">
		<div class="page-title-row">
			<Anvil size={22} class="page-title-icon" />
			<div>
				<h1 class="page-title">CRAFTING LIST</h1>
				<p class="page-subtitle">Equipment and items from NPC Blacksmith and Synthesis</p>
			</div>
		</div>
	</div>

	<div class="controls-bar">
		<div class="search-wrap">
			<Search size={14} class="search-icon" />
			<input
				type="search"
				class="search-input"
				placeholder="Search items..."
				bind:value={searchQuery}
			/>
		</div>
		<div class="cat-tabs">
			{#each CATEGORIES as cat}
				<button
					class="cat-tab {activeCategory === cat ? 'active' : ''}"
					onclick={() => {
						activeCategory = cat;
					}}
				>
					{cat}
				</button>
			{/each}
		</div>
	</div>

	<div class="result-count">{filtered.length} items</div>

	<div class="crafting-grid">
		{#each filtered as item}
			<div class="craft-card">
				<div class="craft-header">
					<div class="craft-info">
						<span class="craft-name">{item.name}</span>
						<div class="craft-meta">
							<span class="craft-type">{item.type}</span>
							<span class="craft-npc" style="color: {NPC_COLOR[item.npc] ?? 'var(--text-dim)'}">
								{item.npc}
							</span>
						</div>
					</div>
					<Wrench size={16} class="craft-icon" />
				</div>
				<div class="materials-label">Materials Required</div>
				<div class="materials-list">
					{#each item.materials as mat}
						<div class="mat-row">
							<Package size={11} class="mat-icon" />
							<span class="mat-name">{mat.name}</span>
							<span class="mat-qty">×{mat.qty.toLocaleString()}</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	{#if filtered.length === 0}
		<div class="empty-state">
			<Package size={36} class="empty-icon" />
			<p>No items found matching your search.</p>
		</div>
	{/if}

	<div class="wip-note">
		<Gem size={13} />
		<span
			>Database expanding — more recipes from all blacksmiths and synthesis NPCs will be added.</span
		>
	</div>
</div>

<style>
	.page {
		max-width: 960px;
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
		color: var(--teal);
		margin-top: 4px;
		flex-shrink: 0;
		filter: drop-shadow(0 0 6px rgba(76, 201, 160, 0.4));
	}
	.page-title {
		font-family: var(--pixel);
		font-size: clamp(0.65rem, 2.5vw, 0.95rem);
		color: var(--teal);
		letter-spacing: 0.06em;
	}
	.page-subtitle {
		font-size: 0.78rem;
		color: var(--text-dim);
		margin-top: 0.3rem;
	}
	.controls-bar {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.search-wrap {
		position: relative;
		max-width: 340px;
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
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.cat-tab {
		padding: 0.35rem 0.85rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.02);
		color: var(--text-dim);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.cat-tab:hover {
		border-color: var(--border-glow);
		color: var(--text-bright);
	}
	.cat-tab.active {
		border-color: rgba(76, 201, 160, 0.5);
		background: rgba(76, 201, 160, 0.08);
		color: var(--teal);
	}
	.result-count {
		font-size: 0.7rem;
		color: var(--text-dim);
		margin-bottom: 0.75rem;
	}
	.crafting-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}
	.craft-card {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		transition: border-color 0.2s;
	}
	.craft-card:hover {
		border-color: var(--border-glow);
	}
	.craft-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.craft-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}
	.craft-name {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--text-bright);
	}
	.craft-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.craft-type {
		font-size: 0.65rem;
		color: var(--text-dim);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 1px 6px;
	}
	.craft-npc {
		font-size: 0.65rem;
		font-weight: 600;
	}
	.craft-card :global(.craft-icon) {
		color: var(--text-dim);
		flex-shrink: 0;
		margin-top: 2px;
	}
	.materials-label {
		font-family: var(--pixel);
		font-size: 0.42rem;
		color: var(--text-dim);
		letter-spacing: 0.08em;
	}
	.materials-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.mat-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 5px;
	}
	.mat-row :global(.mat-icon) {
		color: var(--text-dim);
		flex-shrink: 0;
	}
	.mat-name {
		flex: 1;
		font-size: 0.73rem;
		color: var(--text-mid);
	}
	.mat-qty {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--teal);
		white-space: nowrap;
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
	.wip-note {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 2rem;
		padding: 0.75rem 1rem;
		background: rgba(155, 114, 207, 0.05);
		border: 1px solid rgba(155, 114, 207, 0.2);
		border-radius: 8px;
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	.wip-note :global(svg) {
		color: var(--purple);
		flex-shrink: 0;
	}
</style>
