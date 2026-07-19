<script>
	import { activeBuild } from '$lib/stores/buildStore.js';
	import { onMount } from 'svelte';
	import {
		Sword,
		Shield,
		Shirt,
		Plus,
		Star,
		Gem,
		Package,
		ChevronDown,
		X,
		Search,
		Loader2
	} from '@lucide/svelte';
	import { Modal } from '$lib/components';
	import { loadJson } from '$lib/utils/lazyJson.js';
	import { adaptItem, getStatEntries } from '$lib/utils/item-adapter.js';
	import {
		setEquipItem,
		setEquipRefine,
		setEquipCrysta,
		clearEquipSlot,
		clearEquipCrysta
	} from '$lib/stores/buildStore.js';

	const REFINE_LEVELS = [
		{ value: 0, label: '+0' },
		{ value: 1, label: '+1' },
		{ value: 2, label: '+2' },
		{ value: 3, label: '+3' },
		{ value: 4, label: '+4' },
		{ value: 5, label: '+5' },
		{ value: 6, label: '+6' },
		{ value: 7, label: '+7' },
		{ value: 8, label: '+8' },
		{ value: 9, label: '+9' },
		{ value: 10, label: '+E' },
		{ value: 11, label: '+D' },
		{ value: 12, label: '+C' },
		{ value: 13, label: '+B' },
		{ value: 14, label: '+A' },
		{ value: 15, label: '+S' }
	];
	const refineLabel = (v) => REFINE_LEVELS.find((r) => r.value === v)?.label ?? `+${v}`;

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
	const SUB_WEAPON_TYPES = ['Shield', 'Dagger', 'Ninjutsu Scroll', 'Arrow'];

	const SLOTS = [
		{
			id: 'weapon',
			label: 'Weapon',
			icon: Sword,
			accent: 'gold',
			refineable: true,
			crystaType: 'Weapon Crysta',
			filterFn: (items) => items.filter((i) => WEAPON_TYPES.includes(i.type))
		},
		{
			id: 'subWeapon',
			label: 'Sub Weapon',
			icon: Shield,
			accent: 'teal',
			refineable: false,
			crystaType: null,
			filterFn: (items) => items.filter((i) => SUB_WEAPON_TYPES.includes(i.type))
		},
		{
			id: 'armor',
			label: 'Armor',
			icon: Shirt,
			accent: 'blue',
			refineable: true,
			crystaType: 'Armor Crysta',
			filterFn: (items) => items.filter((i) => i.type === 'Armor')
		},
		{
			id: 'additional',
			label: 'Additional',
			icon: Plus,
			accent: 'purple',
			refineable: true,
			crystaType: 'Additional Crysta',
			filterFn: (items) => items.filter((i) => i.type === 'Additional')
		},
		{
			id: 'special',
			label: 'Special',
			icon: Star,
			accent: 'crimson',
			refineable: false,
			crystaType: 'Special Crysta',
			filterFn: (items) => items.filter((i) => i.type === 'Special')
		}
	];

	let allItems = $state([]);
	let loading = $state(true);
	let equipment = $derived($activeBuild.equipment);
	let modalOpen = $state(false);
	let modalTarget = $state(null);
	let modalSearch = $state('');
	let modalPage = $state(0);
	const PAGE_SIZE = 30;

	onMount(async () => {
		try {
			allItems = await loadJson('items');
		} finally {
			loading = false;
		}
	});

	function getModalItems() {
		if (!modalTarget) return [];
		const slot = SLOTS.find((s) => s.id === modalTarget.slotId);
		if (!slot) return [];
		let pool;
		if (modalTarget.crystaIndex !== null) {
			const ct = slot.crystaType;
			if (!ct) return [];
			pool = allItems.filter(
				(i) => i.type === ct || i.type === 'Normal Crysta' || i.type.startsWith('Enhancer Crysta')
			);
		} else {
			pool = slot.filterFn(allItems);
		}
		if (modalSearch.trim()) {
			const q = modalSearch.toLowerCase();
			pool = pool.filter((i) => i.name.toLowerCase().includes(q));
		}
		return pool;
	}

	let modalItems = $derived(getModalItems());
	let modalPageItems = $derived(
		modalItems.slice(modalPage * PAGE_SIZE, (modalPage + 1) * PAGE_SIZE)
	);
	let modalTotalPages = $derived(Math.ceil(modalItems.length / PAGE_SIZE));

	function openModal(slotId, crystaIndex = null) {
		modalTarget = { slotId, crystaIndex };
		modalSearch = '';
		modalPage = 0;
		modalOpen = true;
	}

	function selectItem(raw) {
		if (!modalTarget) return;
		const adapted = adaptItem(raw);
		if (modalTarget.crystaIndex !== null) {
			setEquipCrysta(modalTarget.slotId, modalTarget.crystaIndex, adapted);
		} else {
			setEquipItem(modalTarget.slotId, adapted);
		}
		modalOpen = false;
	}

	function getAccentVar(accent) {
		return (
			{
				gold: 'var(--gold)',
				teal: 'var(--teal)',
				blue: 'var(--blue)',
				purple: 'var(--purple)',
				crimson: 'var(--crimson)'
			}[accent] ?? 'var(--text-mid)'
		);
	}
</script>

<div class="equip-page">
	{#if loading}
		<div class="equip-loading">
			<Loader2 size={24} class="spin" /><span>Loading items...</span>
		</div>
	{:else}
		<div class="slots-grid">
			{#each SLOTS as slot (slot.id)}
				{@const equip = equipment[slot.id]}
				{@const accentColor = getAccentVar(slot.accent)}
				<div class="slot-card" style="--slot-accent: {accentColor}">
					<div class="slot-header">
						<div class="slot-icon-wrap"><slot.icon size={16} /></div>
						<span class="slot-label">{slot.label}</span>
						{#if slot.refineable && equip.item}
							<select
								class="refine-select"
								value={equip.refine}
								onchange={(e) => setEquipRefine(slot.id, +e.target.value)}
							>
								{#each REFINE_LEVELS as r}<option value={r.value}>{r.label}</option>{/each}
							</select>
						{/if}
						{#if equip.item}
							<button
								class="slot-clear-btn"
								onclick={() => clearEquipSlot(slot.id)}
								title="Remove"><X size={12} /></button
							>
						{/if}
					</div>

					<button
						class="item-pick-btn {equip.item ? 'has-item' : ''}"
						onclick={() => openModal(slot.id, null)}
					>
						{#if equip.item}
							<span class="item-name">{equip.item.name}</span>
							{#if equip.item.baseAtk}
								<span class="item-atk"
									>ATK {equip.item.baseAtk}{slot.refineable
										? ' ' + refineLabel(equip.refine)
										: ''}</span
								>
							{/if}
						{:else}
							<Package size={14} class="empty-icon" />
							<span class="empty-label">Select {slot.label}</span>
						{/if}
					</button>

					{#if slot.crystaType && equip.item}
						<div class="crysta-row">
							{#each [0, 1] as ci}
								{@const crysta = equip.crysta?.[ci]}
								<button
									class="crysta-btn {crysta ? 'has-crysta' : ''}"
									onclick={() => openModal(slot.id, ci)}
								>
									{#if crysta}
										<Gem size={11} /><span class="crysta-name">{crysta.name}</span>
										<button
											class="crysta-clear"
											onclick={(e) => {
												e.stopPropagation();
												clearEquipCrysta(slot.id, ci);
											}}><X size={9} /></button
										>
									{:else}
										<Gem size={11} /><span class="crysta-empty">Crysta {ci + 1}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					{#if equip.item}
						{@const entries = getStatEntries(equip.item)}
						{#if entries.length}
							<div class="item-stats">
								{#each entries.slice(0, 4) as [k, v]}
									<span class="item-stat-chip">{k} {v > 0 ? '+' : ''}{v}</span>
								{/each}
								{#if entries.length > 4}<span class="item-stat-more"
										>+{entries.length - 4} more</span
									>{/if}
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<Modal
	title="Select Item"
	open={modalOpen}
	onclose={() => {
		modalOpen = false;
	}}
>
	<div class="modal-search-wrap">
		<Search size={14} class="modal-search-icon" />
		<input
			type="search"
			class="modal-search"
			placeholder="Search items..."
			bind:value={modalSearch}
			oninput={() => {
				modalPage = 0;
			}}
		/>
	</div>
	<div class="modal-count">{modalItems.length} items</div>
	<div class="modal-list">
		{#each modalPageItems as raw (raw.id ?? raw.name)}
			{@const adapted = adaptItem(raw)}
			{@const entries = getStatEntries(adapted)}
			<button class="modal-item" onclick={() => selectItem(raw)}>
				<div class="modal-item-main">
					<span class="modal-item-name">{raw.name}</span>
					<span class="modal-item-type">{raw.type}</span>
				</div>
				{#if entries.length}
					<div class="modal-item-stats">
						{#each entries.slice(0, 3) as [k, v]}
							<span class="modal-stat-chip">{k} {v > 0 ? '+' : ''}{v}</span>
						{/each}
					</div>
				{/if}
			</button>
		{/each}
	</div>
	{#if modalTotalPages > 1}
		<div class="modal-pagination">
			<button class="page-btn" disabled={modalPage === 0} onclick={() => modalPage--}>‹ Prev</button
			>
			<span class="page-info">{modalPage + 1} / {modalTotalPages}</span>
			<button
				class="page-btn"
				disabled={modalPage >= modalTotalPages - 1}
				onclick={() => modalPage++}>Next ›</button
			>
		</div>
	{/if}
</Modal>

<style>
	.equip-loading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 3rem;
		justify-content: center;
		color: var(--text-dim);
	}
	.equip-loading :global(.spin) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.slots-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
	}
	.slot-card {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		transition: border-color 0.2s;
	}
	.slot-card:hover {
		border-color: var(--slot-accent);
	}
	.slot-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.slot-icon-wrap {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--slot-accent);
		flex-shrink: 0;
	}
	.slot-label {
		font-family: var(--pixel);
		font-size: 0.5rem;
		color: var(--text-mid);
		letter-spacing: 0.05em;
		flex: 1;
	}
	.refine-select {
		width: auto;
		font-size: 0.7rem !important;
		padding: 3px 6px !important;
		color: var(--gold) !important;
		border-color: rgba(244, 197, 66, 0.3) !important;
		background: rgba(244, 197, 66, 0.05) !important;
	}
	.slot-clear-btn {
		background: none;
		border: none;
		color: var(--text-dim);
		cursor: pointer;
		padding: 3px;
		border-radius: 4px;
		display: flex;
		transition: color 0.15s;
	}
	.slot-clear-btn:hover {
		color: var(--crimson);
	}
	.item-pick-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.55rem 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed var(--border);
		border-radius: 7px;
		cursor: pointer;
		color: var(--text-dim);
		font-size: 0.78rem;
		transition: all 0.15s;
		text-align: left;
	}
	.item-pick-btn:hover {
		background: rgba(255, 255, 255, 0.05);
		border-color: var(--slot-accent);
	}
	.item-pick-btn.has-item {
		border-style: solid;
		border-color: rgba(255, 255, 255, 0.12);
		color: var(--text-bright);
		flex-direction: column;
		align-items: flex-start;
		gap: 0.2rem;
	}
	.item-name {
		font-weight: 600;
		font-size: 0.82rem;
	}
	.item-atk {
		font-size: 0.65rem;
		color: var(--slot-accent);
	}
	.empty-icon :global(svg) {
		opacity: 0.4;
	}
	.empty-label {
		font-size: 0.75rem;
	}
	.crysta-row {
		display: flex;
		gap: 0.4rem;
	}
	.crysta-btn {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px dashed var(--border);
		border-radius: 5px;
		cursor: pointer;
		color: var(--text-dim);
		font-size: 0.65rem;
		transition: all 0.15s;
		position: relative;
	}
	.crysta-btn:hover {
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--purple);
	}
	.crysta-btn.has-crysta {
		border-style: solid;
		border-color: rgba(155, 114, 207, 0.35);
		color: var(--purple);
	}
	.crysta-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.62rem;
	}
	.crysta-empty {
		font-size: 0.62rem;
	}
	.crysta-clear {
		background: none;
		border: none;
		color: var(--text-dim);
		cursor: pointer;
		padding: 1px;
		display: flex;
		margin-left: auto;
		border-radius: 3px;
	}
	.crysta-clear:hover {
		color: var(--crimson);
	}
	.item-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.item-stat-chip {
		font-size: 0.6rem;
		padding: 1px 6px;
		background: rgba(74, 158, 255, 0.08);
		border: 1px solid rgba(74, 158, 255, 0.2);
		border-radius: 3px;
		color: var(--blue);
	}
	.item-stat-more {
		font-size: 0.6rem;
		color: var(--text-dim);
		align-self: center;
	}

	/* Modal styles */
	:global(.modal-search-wrap) {
		position: relative;
		margin-bottom: 0.5rem;
	}
	:global(.modal-search-icon) {
		position: absolute;
		left: 0.6rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-dim);
		pointer-events: none;
	}
	:global(.modal-search) {
		padding-left: 2rem !important;
	}
	:global(.modal-count) {
		font-size: 0.7rem;
		color: var(--text-dim);
		margin-bottom: 0.5rem;
	}
	:global(.modal-list) {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		max-height: 360px;
		overflow-y: auto;
	}
	:global(.modal-item) {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.55rem 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 7px;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s;
	}
	:global(.modal-item:hover) {
		background: rgba(255, 255, 255, 0.05);
		border-color: var(--blue);
	}
	:global(.modal-item-main) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	:global(.modal-item-name) {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-bright);
	}
	:global(.modal-item-type) {
		font-size: 0.62rem;
		color: var(--text-dim);
		white-space: nowrap;
	}
	:global(.modal-item-stats) {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	:global(.modal-stat-chip) {
		font-size: 0.58rem;
		padding: 1px 5px;
		background: rgba(74, 158, 255, 0.08);
		border: 1px solid rgba(74, 158, 255, 0.2);
		border-radius: 3px;
		color: var(--blue);
	}
	:global(.modal-pagination) {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
	}
	:global(.page-btn) {
		padding: 5px 14px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 5px;
		color: var(--text-mid);
		font-size: 0.78rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	:global(.page-btn:hover:not(:disabled)) {
		border-color: var(--blue);
		color: var(--blue);
	}
	:global(.page-btn:disabled) {
		opacity: 0.35;
		cursor: not-allowed;
	}
	:global(.page-info) {
		font-size: 0.72rem;
		color: var(--text-dim);
	}
	@media (max-width: 480px) {
		.slots-grid {
			grid-template-columns: 1fr;
		}
	}
</style>