<script>
	import {
		Crosshair,
		Shield,
		FlaskConical,
		Sword,
		UserPlus
	} from '@lucide/svelte';
	import { StatsTab, EquipmentTab, BuffTab, DamageCalculator } from '$lib/components';

	let activeTab = $state('stats');

	const TABS = [
		{ id: 'stats', label: 'Stats', icon: Crosshair },
		{ id: 'equipment', label: 'Equipment', icon: Shield },
		{ id: 'buff', label: 'Buff', icon: FlaskConical },
		{ id: 'damage', label: 'Damage', icon: Sword }
	];
</script>

<svelte:head>
	<title>Character Builder — Toram Lab</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<div class="page-title-row">
			<UserPlus size={22} class="page-title-icon" />
			<div>
				<h1 class="page-title">CHARACTER BUILDER</h1>
				<p class="page-subtitle">Stat allocation, equipment, and buffs — all in one place</p>
			</div>
		</div>
	</div>

	<div class="tab-nav">
		{#each TABS as tab (tab.id)}
			<button
				class="tab-btn {activeTab === tab.id ? 'active' : ''}"
				onclick={() => { activeTab = tab.id; }}
			>
				<tab.icon size={14} />
				<span>{tab.label}</span>
			</button>
		{/each}
	</div>

	{#if activeTab === 'stats'}
		<StatsTab />
	{:else if activeTab === 'equipment'}
		<EquipmentTab />
	{:else if activeTab === 'buff'}
		<BuffTab />
	{:else if activeTab === 'damage'}
		<DamageCalculator />
	{/if}
</div>

<style>
	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 4rem;
	}
	.page-header {
		margin-bottom: 1.25rem;
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

	.tab-nav {
		display: flex;
		gap: 0.35rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--border);
		padding-bottom: 0;
	}
	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.55rem 1rem;
		border: none;
		background: none;
		color: var(--text-dim);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition: all 0.18s;
	}
	.tab-btn:hover {
		color: var(--text-bright);
	}
	.tab-btn.active {
		color: var(--teal);
		border-bottom-color: var(--teal);
	}
	.tab-btn :global(svg) {
		flex-shrink: 0;
	}

	@media (max-width: 700px) {
		.tab-nav {
			gap: 0;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
		}
		.tab-nav::-webkit-scrollbar {
			display: none;
		}
		.tab-btn {
			flex-shrink: 0;
		}
	}
	@media (max-width: 480px) {
		.page {
			padding: 1rem 0.75rem 3rem;
		}
	}
</style>