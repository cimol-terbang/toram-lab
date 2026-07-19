<script>
	import { X, Sword } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { open = false, title = '', onclose = () => {}, children } = $props();

	let visible = $state(false);
	let animating = $state(false);

	$effect(() => {
		if (open) {
			visible = true;
			requestAnimationFrame(() => {
				animating = true;
			});
		} else {
			animating = false;
			setTimeout(() => {
				visible = false;
			}, 300);
		}
	});

	function handleKeydown(e) {
		if (e.key === 'Escape' && open) onclose();
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if visible}
	<div
		class="modal-overlay"
		class:active={animating}
		onclick={(e) => {
			if (e.target === e.currentTarget) onclose();
		}}
		role="dialog"
		aria-modal="true"
		aria-label={title || 'Modal'}
	>
		<div class="modal-panel" class:active={animating}>
			<div class="modal-header">
				<div class="modal-title-row">
					<Sword size={18} class="title-icon" />
					<h3 class="modal-title">{title}</h3>
				</div>
				<button class="modal-close" onclick={onclose} aria-label="Close">
					<X size={18} />
				</button>
			</div>
			<div class="modal-body">
				{@render children()}
			</div>
			<div class="modal-corner tl"></div>
			<div class="modal-corner tr"></div>
			<div class="modal-corner bl"></div>
			<div class="modal-corner br"></div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(4, 6, 12, 0.75);
		backdrop-filter: blur(4px);
		opacity: 0;
		transition: opacity 0.3s;
		padding: 1rem;
	}
	.modal-overlay.active {
		opacity: 1;
	}

	.modal-panel {
		position: relative;
		background: linear-gradient(160deg, #141e35, #0f1626);
		border: 2px solid var(--border-glow);
		border-radius: 8px;
		width: 100%;
		max-width: 520px;
		max-height: 85vh;
		overflow-y: auto;
		transform: scale(0.9) translateY(20px);
		transition:
			transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.3s;
		opacity: 0;
		box-shadow:
			0 0 40px rgba(74, 158, 255, 0.15),
			0 0 80px rgba(74, 158, 255, 0.05);
	}
	.modal-panel.active {
		transform: scale(1) translateY(0);
		opacity: 1;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border);
		background: rgba(8, 12, 20, 0.6);
	}

	.modal-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.title-icon {
		color: var(--gold);
	}

	.modal-title {
		font-family: var(--pixel);
		font-size: 0.7rem;
		color: var(--gold);
		letter-spacing: 0.05em;
	}

	.modal-close {
		background: none;
		border: 1px solid var(--border);
		color: var(--text-mid);
		border-radius: 4px;
		padding: 4px;
		display: flex;
		transition: all 0.2s;
	}
	.modal-close:hover {
		color: var(--crimson);
		border-color: var(--crimson);
		background: rgba(230, 57, 70, 0.1);
	}

	.modal-body {
		padding: 1.25rem;
		color: var(--text-mid);
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.modal-corner {
		position: absolute;
		width: 12px;
		height: 12px;
		border-color: var(--gold);
		border-style: solid;
		opacity: 0.4;
		pointer-events: none;
	}
	.modal-corner.tl {
		top: -2px;
		left: -2px;
		border-width: 2px 0 0 2px;
		border-radius: 4px 0 0 0;
	}
	.modal-corner.tr {
		top: -2px;
		right: -2px;
		border-width: 2px 2px 0 0;
		border-radius: 0 4px 0 0;
	}
	.modal-corner.bl {
		bottom: -2px;
		left: -2px;
		border-width: 0 0 2px 2px;
		border-radius: 0 0 0 4px;
	}
	.modal-corner.br {
		bottom: -2px;
		right: -2px;
		border-width: 0 2px 2px 0;
		border-radius: 0 0 4px 0;
	}

	@media (max-width: 480px) {
		.modal-panel {
			max-width: 100%;
			margin: 0.5rem;
		}
		.modal-body {
			padding: 1rem;
		}
	}
</style>
