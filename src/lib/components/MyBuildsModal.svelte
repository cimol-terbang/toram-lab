<script>
	import {
		activeBuild,
		buildSlots,
		saveBuildToSlot,
		loadBuildFromSlot,
		renameBuildSlot,
		deleteBuildSlot,
		defaultActiveBuild
	} from '$lib/stores/buildStore.js';
	import Modal from './Modal.svelte';
	import {
		Save,
		FolderOpen,
		Trash2,
		Pencil,
		Check,
		X,
		Sword,
		Shield,
		Star,
		Plus,
		Gem,
		Clock,
		BookOpen
	} from '@lucide/svelte';

	let { open = false, onclose = () => {} } = $props();

	const MAX_SLOTS = 10;
	let slots = $derived($buildSlots);
	let current = $derived($activeBuild);

	// rename state
	let renamingSlot = $state(null);
	let renameValue = $state('');

	// confirm delete
	let deletingSlot = $state(null);

	// flash saved
	let flashSlot = $state(null);

	function handleSave(idx) {
		const slotName = slots[idx]?.name || `Build ${idx + 1}`;
		saveBuildToSlot(idx, slotName);
		flashSlot = idx;
		setTimeout(() => {
			flashSlot = null;
		}, 1600);
	}

	function handleLoad(idx) {
		loadBuildFromSlot(idx);
		onclose();
	}

	function startRename(idx) {
		renamingSlot = idx;
		renameValue = slots[idx]?.name || `Build ${idx + 1}`;
	}

	function commitRename(idx) {
		if (renameValue.trim()) renameBuildSlot(idx, renameValue.trim());
		renamingSlot = null;
	}

	function confirmDelete(idx) {
		deletingSlot = idx;
	}

	function doDelete() {
		deleteBuildSlot(deletingSlot);
		deletingSlot = null;
	}

	function formatDate(ts) {
		if (!ts) return '';
		return new Date(ts).toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	// snapshot preview helpers
	function equipCount(snapshot) {
		if (!snapshot?.equipment) return 0;
		return Object.values(snapshot.equipment).filter((e) => e?.item).length;
	}

	function crystaCount(snapshot) {
		if (!snapshot?.equipment) return 0;
		return Object.values(snapshot.equipment)
			.flatMap((e) => e?.crysta ?? [])
			.filter(Boolean).length;
	}

	function statSummary(snapshot) {
		if (!snapshot?.stat) return '';
		const s = snapshot.stat;
		return `Lv${s.level} · STR${s.str} DEX${s.dex} INT${s.int} VIT${s.vit} AGI${s.agi}`;
	}

	const filledCount = $derived(slots.filter((s) => s.name !== null).length);
</script>

<Modal title="MY BUILDS" {open} {onclose}>
	<div class="mb-root">
		<!-- header info -->
		<div class="mb-info">
			<BookOpen size={13} />
			<span>{filledCount} / {MAX_SLOTS} slots used</span>
			<span class="mb-info-sep">·</span>
			<span>Klik <strong>Save</strong> untuk simpan build aktif ke slot</span>
		</div>

		<!-- Slots list -->
		<div class="mb-slots">
			{#each Array.from({ length: MAX_SLOTS }, (_, i) => i) as idx}
				{@const slot = slots[idx]}
				{@const filled = slot?.name !== null}
				{@const isFlash = flashSlot === idx}
				<div class="mb-slot {filled ? 'filled' : 'empty'} {isFlash ? 'flash' : ''}">
					<!-- slot number -->
					<div class="mb-slot-num">#{idx + 1}</div>

					<!-- slot body -->
					<div class="mb-slot-body">
						{#if filled}
							<!-- Name row -->
							{#if renamingSlot === idx}
								<div class="rename-row">
									<input
										class="rename-input"
										bind:value={renameValue}
										onkeydown={(e) => {
											if (e.key === 'Enter') commitRename(idx);
											if (e.key === 'Escape') renamingSlot = null;
										}}
										autofocus
									/>
									<button class="icon-act confirm" onclick={() => commitRename(idx)}
										><Check size={12} /></button
									>
									<button class="icon-act cancel" onclick={() => (renamingSlot = null)}
										><X size={12} /></button
									>
								</div>
							{:else}
								<div class="mb-name-row">
									<span class="mb-name">{slot.name}</span>
									<button class="icon-act rename" onclick={() => startRename(idx)} title="Rename"
										><Pencil size={11} /></button
									>
								</div>
							{/if}

							<!-- snapshot preview -->
							<div class="mb-preview">
								<span class="preview-stat">{statSummary(slot.snapshot)}</span>
								<div class="preview-chips">
									<span class="pchip gear"><Sword size={9} /> {equipCount(slot.snapshot)} gear</span
									>
									<span class="pchip crysta"
										><Gem size={9} /> {crystaCount(slot.snapshot)} crysta</span
									>
									{#if slot.savedAt}
										<span class="pchip date"><Clock size={9} /> {formatDate(slot.savedAt)}</span>
									{/if}
								</div>
							</div>
						{:else}
							<span class="mb-empty-label">Empty slot</span>
						{/if}
					</div>

					<!-- actions -->
					<div class="mb-slot-actions">
						<!-- Save current build to this slot -->
						<button
							class="mb-act save-act {isFlash ? 'flashed' : ''}"
							onclick={() => handleSave(idx)}
							title="Save current build here"
						>
							{#if isFlash}
								<Check size={13} />
							{:else}
								<Save size={13} />
							{/if}
						</button>

						{#if filled}
							<button
								class="mb-act load-act"
								onclick={() => handleLoad(idx)}
								title="Load this build"
							>
								<FolderOpen size={13} />
							</button>
							<button class="mb-act del-act" onclick={() => confirmDelete(idx)} title="Delete">
								<Trash2 size={13} />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</Modal>

<!-- Delete confirm inline (inside root modal) -->
{#if deletingSlot !== null}
	<Modal
		title="Hapus Build?"
		open={true}
		onclose={() => {
			deletingSlot = null;
		}}
	>
		<div class="confirm-body">
			<p>Hapus <strong>"{slots[deletingSlot]?.name}"</strong>? Tidak bisa di-undo.</p>
			<div class="confirm-acts">
				<button class="conf-btn del" onclick={doDelete}>
					<Trash2 size={13} /> Hapus
				</button>
				<button
					class="conf-btn cancel"
					onclick={() => {
						deletingSlot = null;
					}}
				>
					Batal
				</button>
			</div>
		</div>
	</Modal>
{/if}

<style>
	.mb-root {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.mb-info {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.7rem;
		color: var(--text-dim);
		padding: 0.5rem 0.65rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 6px;
	}

	.mb-info :global(svg) {
		color: var(--gold);
	}
	.mb-info strong {
		color: var(--teal);
	}
	.mb-info-sep {
		opacity: 0.4;
	}

	/* ─── SLOTS ─── */
	.mb-slots {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-height: 420px;
		overflow-y: auto;
		padding-right: 2px;
	}

	.mb-slot {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0.7rem;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: rgba(8, 12, 20, 0.4);
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.mb-slot.filled {
		border-color: var(--border-glow);
	}
	.mb-slot.filled:hover {
		border-color: rgba(74, 158, 255, 0.35);
	}

	.mb-slot.flash {
		animation: flashSave 0.5s ease;
	}

	@keyframes flashSave {
		0% {
			box-shadow: 0 0 0 rgba(76, 201, 160, 0);
		}
		40% {
			box-shadow: 0 0 16px rgba(76, 201, 160, 0.45);
			border-color: rgba(76, 201, 160, 0.6);
		}
		100% {
			box-shadow: 0 0 0 rgba(76, 201, 160, 0);
		}
	}

	.mb-slot-num {
		font-family: var(--pixel);
		font-size: 0.45rem;
		color: var(--text-dim);
		min-width: 20px;
		flex-shrink: 0;
	}

	/* ─── SLOT BODY ─── */
	.mb-slot-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.mb-name-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.mb-name {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--text-bright);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mb-empty-label {
		font-size: 0.72rem;
		color: var(--text-dim);
	}

	/* ─── PREVIEW ─── */
	.mb-preview {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.preview-stat {
		font-size: 0.62rem;
		color: var(--text-dim);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-chips {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}

	.pchip {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.58rem;
		padding: 1px 5px;
		border-radius: 3px;
		border: 1px solid var(--border);
		color: var(--text-dim);
	}

	.pchip.gear {
		color: var(--gold);
		border-color: rgba(244, 197, 66, 0.2);
		background: rgba(244, 197, 66, 0.04);
	}
	.pchip.crysta {
		color: var(--purple);
		border-color: rgba(155, 114, 207, 0.2);
		background: rgba(155, 114, 207, 0.04);
	}
	.pchip.date {
		color: var(--text-dim);
	}

	/* ─── RENAME ─── */
	.rename-row {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.rename-input {
		flex: 1;
		font-size: 0.8rem !important;
		padding: 3px 7px !important;
		border-radius: 4px;
	}

	/* ─── ACTIONS ─── */
	.mb-slot-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.icon-act {
		background: none;
		border: 1px solid var(--border);
		color: var(--text-dim);
		border-radius: 4px;
		padding: 3px;
		display: flex;
		cursor: pointer;
		transition: all 0.15s;
	}

	.icon-act.confirm:hover {
		color: var(--teal);
		border-color: var(--teal);
	}
	.icon-act.cancel:hover {
		color: var(--crimson);
		border-color: var(--crimson);
	}
	.icon-act.rename:hover {
		color: var(--blue);
		border-color: var(--blue);
	}

	.mb-act {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: rgba(8, 12, 20, 0.4);
		color: var(--text-dim);
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.save-act {
		color: var(--teal);
		border-color: rgba(76, 201, 160, 0.3);
	}
	.save-act:hover {
		background: rgba(76, 201, 160, 0.1);
		border-color: var(--teal);
	}
	.save-act.flashed {
		color: var(--teal);
		background: rgba(76, 201, 160, 0.15);
	}

	.load-act:hover {
		color: var(--blue);
		border-color: rgba(74, 158, 255, 0.4);
		background: rgba(74, 158, 255, 0.07);
	}
	.del-act:hover {
		color: var(--crimson);
		border-color: rgba(230, 57, 70, 0.4);
		background: rgba(230, 57, 70, 0.06);
	}

	/* ─── CONFIRM ─── */
	.confirm-body {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.confirm-body p {
		font-size: 0.82rem;
		color: var(--text-mid);
		line-height: 1.6;
	}
	.confirm-body strong {
		color: var(--text-bright);
	}
	.confirm-acts {
		display: flex;
		gap: 0.5rem;
	}

	.conf-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.9rem;
		border-radius: 5px;
		border: 1px solid;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.conf-btn.del {
		background: rgba(230, 57, 70, 0.1);
		border-color: rgba(230, 57, 70, 0.4);
		color: var(--crimson);
	}
	.conf-btn.del:hover {
		background: rgba(230, 57, 70, 0.2);
	}
	.conf-btn.cancel {
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--border);
		color: var(--text-mid);
	}
	.conf-btn.cancel:hover {
		color: var(--text-bright);
	}
</style>
