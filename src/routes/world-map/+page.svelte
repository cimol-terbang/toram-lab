<script>
	import { Map, Search, Bug, Package, ChevronDown, ChevronRight, MapPin } from '@lucide/svelte';

	const WORLD_DATA = [
		{
			region: 'Sofya City',
			color: 'var(--teal)',
			maps: [
				{
					name: 'Sofya City',
					level: '1~20',
					monsters: [
						{ name: 'Slime', level: 3, drops: ['Slime Jelly', 'Clear Liquid'] },
						{ name: 'Goblin', level: 8, drops: ['Goblin Ear', 'Old Cloth'] }
					]
				},
				{
					name: 'Sofya Outskirts',
					level: '5~25',
					monsters: [{ name: 'Wolf', level: 12, drops: ['Wolf Fang', 'Fur'] }]
				}
			]
		},
		{
			region: 'Kaus Ruins',
			color: 'var(--gold)',
			maps: [
				{
					name: 'Kaus Ruins 1F',
					level: '80~120',
					monsters: [
						{ name: 'Golem', level: 90, drops: ['Stone Fragment', 'Hard Shell'] },
						{ name: 'Ruin Bat', level: 85, drops: ['Bat Wing', 'Dark Stone'] }
					]
				}
			]
		},
		{
			region: 'Crater of the Moon',
			color: 'var(--purple)',
			maps: [
				{
					name: 'Moon Crater',
					level: '150~200',
					monsters: [{ name: 'Lunar Wisp', level: 165, drops: ['Moon Shard', 'Lunar Dust'] }]
				}
			]
		}
	];

	let searchQuery = $state('');
	let expandedRegions = $state(new Set(['Sofya City']));
	let expandedMaps = $state(new Set());

	function toggleRegion(name) {
		const next = new Set(expandedRegions);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		expandedRegions = next;
	}

	function toggleMap(name) {
		const next = new Set(expandedMaps);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		expandedMaps = next;
	}

	let filtered = $derived(
		WORLD_DATA.map((region) => ({
			...region,
			maps: region.maps.filter((map) => {
				if (!searchQuery) return true;
				const q = searchQuery.toLowerCase();
				return (
					map.name.toLowerCase().includes(q) ||
					map.monsters.some(
						(m) =>
							m.name.toLowerCase().includes(q) || m.drops.some((d) => d.toLowerCase().includes(q))
					)
				);
			})
		})).filter((r) => r.maps.length > 0)
	);
</script>

<svelte:head><title>World Map — Toram Lab</title></svelte:head>

<div class="page">
	<div class="page-header">
		<div class="page-title-row">
			<Map size={22} class="page-title-icon" />
			<div>
				<h1 class="page-title">WORLD MAP</h1>
				<p class="page-subtitle">Maps, monsters, and drop locations across Toram</p>
			</div>
		</div>
	</div>

	<div class="search-wrap">
		<Search size={14} class="search-icon" />
		<input
			type="search"
			class="search-input"
			placeholder="Search maps, monsters, or drops..."
			bind:value={searchQuery}
		/>
	</div>

	<div class="world-list">
		{#each filtered as region}
			<div class="region-block">
				<button
					class="region-header"
					onclick={() => toggleRegion(region.region)}
					style="--rcolor: {region.color}"
				>
					<MapPin size={15} class="region-pin" />
					<span class="region-name">{region.region}</span>
					<span class="region-count">{region.maps.length} maps</span>
					<ChevronDown
						size={15}
						class="region-caret {expandedRegions.has(region.region) ? 'open' : ''}"
					/>
				</button>

				{#if expandedRegions.has(region.region)}
					<div class="maps-list">
						{#each region.maps as map}
							<div class="map-block">
								<button class="map-header" onclick={() => toggleMap(map.name)}>
									<span class="map-name">{map.name}</span>
									<span class="map-level">Lv {map.level}</span>
									<ChevronRight
										size={13}
										class="map-caret {expandedMaps.has(map.name) ? 'open' : ''}"
									/>
								</button>

								{#if expandedMaps.has(map.name)}
									<div class="monsters-list">
										{#each map.monsters as mob}
											<div class="mob-row">
												<Bug size={13} class="mob-icon" />
												<div class="mob-info">
													<span class="mob-name">{mob.name}</span>
													<span class="mob-level">Lv {mob.level}</span>
												</div>
												<div class="mob-drops">
													{#each mob.drops as drop}
														<span class="drop-chip">
															<Package size={10} />{drop}
														</span>
													{/each}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="wip-note">
		<Map size={13} />
		<span>World data is being expanded. More regions, maps, and drop tables coming soon.</span>
	</div>
</div>

<style>
	.page {
		max-width: 860px;
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
	.search-wrap {
		position: relative;
		max-width: 400px;
		margin-bottom: 1.5rem;
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
	.world-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.region-block {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
	}
	.region-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.85rem 1rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
		border-left: 3px solid var(--rcolor);
	}
	.region-header:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.region-header :global(.region-pin) {
		color: var(--rcolor);
		flex-shrink: 0;
	}
	.region-name {
		font-family: var(--pixel);
		font-size: 0.55rem;
		color: var(--text-bright);
		letter-spacing: 0.05em;
		flex: 1;
	}
	.region-count {
		font-size: 0.65rem;
		color: var(--text-dim);
	}
	.region-header :global(.region-caret) {
		color: var(--text-dim);
		transition: transform 0.2s;
		flex-shrink: 0;
	}
	.region-header :global(.region-caret.open) {
		transform: rotate(180deg);
	}
	.maps-list {
		padding: 0 0.75rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.map-block {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 7px;
		overflow: hidden;
	}
	.map-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0.85rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}
	.map-header:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.map-name {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-bright);
		flex: 1;
	}
	.map-level {
		font-size: 0.65rem;
		color: var(--text-dim);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 1px 7px;
		white-space: nowrap;
	}
	.map-header :global(.map-caret) {
		color: var(--text-dim);
		transition: transform 0.2s;
		flex-shrink: 0;
	}
	.map-header :global(.map-caret.open) {
		transform: rotate(90deg);
	}
	.monsters-list {
		padding: 0 0.75rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.mob-row {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		padding: 0.5rem 0.6rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.04);
	}
	.mob-row :global(.mob-icon) {
		color: var(--crimson);
		flex-shrink: 0;
		margin-top: 2px;
	}
	.mob-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 100px;
	}
	.mob-name {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-bright);
	}
	.mob-level {
		font-size: 0.62rem;
		color: var(--text-dim);
	}
	.mob-drops {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		flex: 1;
	}
	.drop-chip {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.62rem;
		padding: 2px 7px;
		background: rgba(76, 201, 160, 0.06);
		border: 1px solid rgba(76, 201, 160, 0.2);
		border-radius: 4px;
		color: var(--teal);
	}
	.wip-note {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 2rem;
		padding: 0.75rem 1rem;
		background: rgba(76, 201, 160, 0.05);
		border: 1px solid rgba(76, 201, 160, 0.2);
		border-radius: 8px;
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	.wip-note :global(svg) {
		color: var(--teal);
		flex-shrink: 0;
	}
</style>
