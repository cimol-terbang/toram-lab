<script>
	import { CheckCircle, XCircle, AlertTriangle, Info, X } from '@lucide/svelte';

	let {
		message = '',
		type = 'info',
		visible = false,
		duration = 4000,
		onclose = () => {}
	} = $props();

	let showing = $state(false);
	let leaving = $state(false);

	const icons = {
		success: CheckCircle,
		error: XCircle,
		warning: AlertTriangle,
		info: Info
	};

	const colors = {
		success: 'var(--teal)',
		error: 'var(--crimson)',
		warning: 'var(--gold)',
		info: 'var(--blue)'
	};

	let timer;

	$effect(() => {
		if (visible && !showing) {
			showing = true;
			leaving = false;
			clearTimeout(timer);
			timer = setTimeout(() => {
				leaving = true;
				setTimeout(() => {
					showing = false;
					onclose();
				}, 300);
			}, duration);
		}
	});

	const Icon = $derived(icons[type] || icons.info);
	const color = $derived(colors[type] || colors.info);
</script>

{#if showing}
	<div class="toast" class:leave={leaving} style="--toast-color: {color}">
		<div class="toast-icon">
			<Icon size={18} />
		</div>
		<span class="toast-msg">{message}</span>
		<button
			class="toast-close"
			onclick={() => {
				leaving = true;
				setTimeout(() => {
					showing = false;
					onclose();
				}, 300);
			}}
		>
			<X size={14} />
		</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 2000;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.75rem 1rem;
		background: var(--bg-panel);
		border: 1px solid var(--toast-color);
		border-radius: 6px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.5),
			0 0 20px color-mix(in srgb, var(--toast-color) 15%, transparent);
		animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		max-width: 360px;
	}

	.toast.leave {
		animation: slideOut 0.3s ease-in forwards;
	}

	.toast-icon {
		flex-shrink: 0;
		color: var(--toast-color);
	}

	.toast-msg {
		flex: 1;
		font-size: 0.8rem;
		color: var(--text-bright);
	}

	.toast-close {
		flex-shrink: 0;
		background: none;
		border: none;
		color: var(--text-dim);
		padding: 2px;
		display: flex;
		transition: color 0.2s;
	}
	.toast-close:hover {
		color: var(--text-bright);
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@keyframes slideOut {
		from {
			transform: translateX(0);
			opacity: 1;
		}
		to {
			transform: translateX(100%);
			opacity: 0;
		}
	}

	@media (max-width: 480px) {
		.toast {
			left: 1rem;
			right: 1rem;
			bottom: 1rem;
			max-width: none;
		}
	}
</style>
