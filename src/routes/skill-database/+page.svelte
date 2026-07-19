<script>
	import { Zap, Search, Filter, ChevronDown, BookOpen, Sword, Star } from '@lucide/svelte';

	const SKILL_TYPES = [
		'All',
		'Sword',
		'Magic',
		'Shot',
		'Martial',
		'Halberd',
		'Katana',
		'Support',
		'Survival'
	];
	let activeType = $state('All');
	let searchQuery = $state('');

	const SKILLS = [
		{
			name: 'Hard Hit',
			type: 'Sword',
			element: 'None',
			mpCost: 200,
			maxLv: 10,
			desc: 'Deals physical damage. Generates aggro.'
		},
		{
			name: 'Sonic Blade',
			type: 'Sword',
			element: 'None',
			mpCost: 100,
			maxLv: 10,
			desc: 'Fast ranged sword slash. Low MP cost.'
		},
		{
			name: 'Sword Tempest',
			type: 'Sword',
			element: 'None',
			mpCost: 600,
			maxLv: 10,
			desc: 'High power AoE sword skill.'
		},
		{
			name: 'Magic Arrow',
			type: 'Magic',
			element: 'Light',
			mpCost: 300,
			maxLv: 10,
			desc: 'Basic magic attack. Fast cast.'
		},
		{
			name: 'Meteor Strike',
			type: 'Magic',
			element: 'Fire',
			mpCost: 800,
			maxLv: 10,
			desc: 'Large AoE fire damage.'
		},
		{
			name: 'Storm',
			type: 'Magic',
			element: 'Wind',
			mpCost: 700,
			maxLv: 10,
			desc: 'Wind AoE, multiple hits.'
		},
		{
			name: 'Dual Wield',
			type: 'Sword',
			element: 'None',
			mpCost: 0,
			maxLv: 10,
			desc: 'Passive — enables dual sword wielding.'
		},
		{
			name: 'First Aid',
			type: 'Support',
			element: 'None',
			mpCost: 200,
			maxLv: 10,
			desc: 'Restores a small amount of HP.'
		},
		{
			name: 'Armor Break',
			type: 'Martial',
			element: 'None',
			mpCost: 400,
			maxLv: 10,
			desc: 'Reduces target DEF temporarily.'
		}
	];

	const ELEMENT_COLOR = {
		None: 'var(--text-dim)',
		Fire: '#e67e22',
		Water: 'var(--blue)',
		Wind: 'var(--teal)',
		Earth: '#a0522d',
		Light: 'var(--gold)',
		Dark: 'var(--purple)'
	};

	let filtered = $derived(
		SKILLS.filter((s) => {
			const typeMatch = activeType === 'All' || s.type === activeType;
			const searchMatch =
				!searchQuery ||
				s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				s.desc.toLowerCase().includes(searchQuery.toLowerCase());
			return typeMatch && searchMatch;
		})
	);
</script>

<svelte:head><title>Skill Database — Toram Lab</title></svelte:head>

<div class="page">
	<div class="page-header">
		<div class="page-title-row">
			<Zap size={22} class="page-title-icon" />
			<div>
				<h1 class="page-title">SKILL DATABASE</h1>
				<p class="page-subtitle">All skills, effects, and MP costs</p>
			</div>
		</div>
	</div>

	<div class="controls">
		<div class="search-wrap">
			<Search size={14} class="search-icon" />
			<input
				type="search"
				class="search-input"
				placeholder="Search skills..."
				bind:value={searchQuery}
			/>
		</div>
		<div class="type-tabs">
			{#each SKILL_TYPES as t}
				<button
					class="type-tab {activeType === t ? 'active' : ''}"
					onclick={() => {
						activeType = t;
					}}>{t}</button
				>
			{/each}
		</div>
	</div>

	<div class="result-count">{filtered.length} skills</div>

	<div class="skills-grid">
		{#each filtered as skill}
			<div class="skill-card">
				<div class="skill-header">
					<div class="skill-icon-wrap"><Zap size={16} /></div>
					<div class="skill-main">
						<span class="skill-name">{skill.name}</span>
						<div class="skill-tags">
							<span class="skill-type">{skill.type}</span>
							<span
								class="skill-element"
								style="color: {ELEMENT_COLOR[skill.element] ?? 'var(--text-dim)'}"
								>{skill.element}</span
							>
						</div>
					</div>
					<div class="skill-meta">
						<span class="mp-cost">{skill.mpCost} MP</span>
						<span class="max-lv">Lv {skill.maxLv}</span>
					</div>
				</div>
				<p class="skill-desc">{skill.desc}</p>
			</div>
		{/each}
	</div>

	{#if filtered.length === 0}
		<div class="empty-state">
			<BookOpen size={36} class="empty-icon" />
			<p>No skills found.</p>
		</div>
	{/if}

	<div class="wip-note">
		<Star size={13} /><span
			>Full skill tree with level scaling, prerequisites, and interaction notes coming soon.</span
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
		color: var(--gold);
		margin-top: 4px;
		flex-shrink: 0;
		filter: drop-shadow(0 0 6px rgba(244, 197, 66, 0.4));
	}
	.page-title {
		font-family: var(--pixel);
		font-size: clamp(0.65rem, 2.5vw, 0.95rem);
		color: var(--gold);
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
	.type-tabs {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.type-tab {
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.02);
		color: var(--text-dim);
		font-size: 0.73rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.type-tab:hover {
		border-color: var(--border-glow);
		color: var(--text-bright);
	}
	.type-tab.active {
		border-color: rgba(244, 197, 66, 0.5);
		background: rgba(244, 197, 66, 0.08);
		color: var(--gold);
	}
	.result-count {
		font-size: 0.7rem;
		color: var(--text-dim);
		margin-bottom: 0.75rem;
	}
	.skills-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.65rem;
	}
	.skill-card {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		transition: border-color 0.2s;
	}
	.skill-card:hover {
		border-color: rgba(244, 197, 66, 0.3);
	}
	.skill-header {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
	}
	.skill-icon-wrap {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		background: rgba(244, 197, 66, 0.07);
		border: 1px solid rgba(244, 197, 66, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gold);
		flex-shrink: 0;
	}
	.skill-main {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
	}
	.skill-name {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--text-bright);
	}
	.skill-tags {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.skill-type {
		font-size: 0.62rem;
		color: var(--text-dim);
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 1px 6px;
	}
	.skill-element {
		font-size: 0.62rem;
		font-weight: 600;
	}
	.skill-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.2rem;
		flex-shrink: 0;
	}
	.mp-cost {
		font-size: 0.65rem;
		color: var(--blue);
		background: rgba(74, 158, 255, 0.07);
		border: 1px solid rgba(74, 158, 255, 0.2);
		border-radius: 4px;
		padding: 1px 6px;
		white-space: nowrap;
	}
	.max-lv {
		font-size: 0.6rem;
		color: var(--text-dim);
	}
	.skill-desc {
		font-size: 0.72rem;
		color: var(--text-mid);
		line-height: 1.55;
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
		background: rgba(244, 197, 66, 0.04);
		border: 1px solid rgba(244, 197, 66, 0.18);
		border-radius: 8px;
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	.wip-note :global(svg) {
		color: var(--gold);
		flex-shrink: 0;
	}
</style>
