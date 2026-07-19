<script>
	import { FlaskConical } from '@lucide/svelte';

	const BUFF_CATEGORIES = [
		{ id: 'skill', label: 'Skill Buffs', color: 'var(--teal)' },
		{ id: 'food', label: 'Food Buffs', color: 'var(--gold)' },
		{ id: 'potion', label: 'Potions', color: 'var(--purple)' }
	];
</script>

<div class="buff-page">
	<div class="coming-soon-banner">
		<FlaskConical size={32} class="cs-icon" />
		<div>
			<h2 class="cs-title">BUFF PLANNER</h2>
			<p class="cs-desc">
				Plan your skill buffs, passive abilities, and food buffs. Track how each buff stacks
				with your build.
			</p>
			<span class="cs-badge">Coming Soon</span>
		</div>
	</div>
	<div class="buff-preview-grid">
		{#each BUFF_CATEGORIES as cat (cat.id)}
			<div class="buff-cat-card" style="--cat-color: {cat.color}">
				<FlaskConical size={18} />
				<span class="buff-cat-label">{cat.label}</span>
				<span class="buff-cat-empty">No buffs added</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.buff-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.coming-soon-banner {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 1.5rem;
		background: linear-gradient(135deg, rgba(155, 114, 207, 0.08), rgba(76, 201, 160, 0.05));
		border: 1px solid rgba(155, 114, 207, 0.25);
		border-radius: 12px;
	}
	.coming-soon-banner :global(.cs-icon) {
		color: var(--purple);
		flex-shrink: 0;
		filter: drop-shadow(0 0 8px rgba(155, 114, 207, 0.4));
	}
	.cs-title {
		font-family: var(--pixel);
		font-size: 0.7rem;
		color: var(--purple);
		letter-spacing: 0.1em;
		margin-bottom: 0.4rem;
	}
	.cs-desc {
		font-size: 0.8rem;
		color: var(--text-mid);
		line-height: 1.6;
		margin-bottom: 0.65rem;
	}
	.cs-badge {
		display: inline-block;
		font-family: var(--pixel);
		font-size: 0.45rem;
		padding: 3px 8px;
		background: rgba(155, 114, 207, 0.15);
		border: 1px solid rgba(155, 114, 207, 0.4);
		border-radius: 4px;
		color: var(--purple);
		letter-spacing: 0.1em;
	}
	.buff-preview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}
	.buff-cat-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--cat-color);
	}
	.buff-cat-card :global(svg) {
		color: var(--cat-color);
	}
	.buff-cat-label {
		font-family: var(--pixel);
		font-size: 0.5rem;
		letter-spacing: 0.06em;
	}
	.buff-cat-empty {
		font-size: 0.7rem;
		color: var(--text-dim);
	}
	@media (max-width: 480px) {
		.buff-preview-grid {
			grid-template-columns: 1fr;
		}
		.coming-soon-banner {
			flex-direction: column;
			text-align: center;
			padding: 1.25rem 1rem;
		}
	}
</style>