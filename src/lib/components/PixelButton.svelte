<script>
	import { Loader2 } from '@lucide/svelte';

	let {
		children,
		onclick = () => {},
		variant = 'gold',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button'
	} = $props();
</script>

<button
	{type}
	class="pixel-btn"
	class:gold={variant === 'gold'}
	class:teal={variant === 'teal'}
	class:crimson={variant === 'crimson'}
	class:sm={size === 'sm'}
	class:lg={size === 'lg'}
	{disabled}
	{onclick}
>
	{#if loading}
		<Loader2 size={16} class="spin" />
	{:else}
		{@render children()}
	{/if}
</button>

<style>
	.pixel-btn {
		font-family: var(--pixel);
		letter-spacing: 0.08em;
		border-radius: 4px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		transition: all 0.2s;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		text-transform: uppercase;
	}

	.pixel-btn::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			transparent 40%,
			rgba(255, 255, 255, 0.05) 50%,
			transparent 60%
		);
		transition: transform 0.4s;
		transform: translateX(-100%);
	}
	.pixel-btn:hover::before {
		transform: translateX(100%);
	}

	.md {
		padding: 0.8rem 1.5rem;
		font-size: 0.6rem;
	}
	.sm {
		padding: 0.5rem 1rem;
		font-size: 0.5rem;
	}
	.lg {
		padding: 1rem 2rem;
		font-size: 0.7rem;
	}

	.gold {
		background: linear-gradient(135deg, #1a2845, #0f1626);
		color: var(--gold);
		border: 2px solid var(--gold);
		box-shadow:
			0 0 15px rgba(244, 197, 66, 0.15),
			inset 0 0 10px rgba(244, 197, 66, 0.05);
	}
	.gold:hover:not(:disabled) {
		background: linear-gradient(135deg, #2a3855, #1a2845);
		box-shadow:
			0 0 25px rgba(244, 197, 66, 0.3),
			inset 0 0 15px rgba(244, 197, 66, 0.1);
		transform: translateY(-2px);
	}

	.teal {
		background: linear-gradient(135deg, #0f1f1a, #0a1410);
		color: var(--teal);
		border: 2px solid var(--teal-dim);
		box-shadow:
			0 0 15px rgba(76, 201, 160, 0.1),
			inset 0 0 10px rgba(76, 201, 160, 0.05);
	}
	.teal:hover:not(:disabled) {
		background: linear-gradient(135deg, #1a2f28, #0f1f1a);
		box-shadow:
			0 0 25px rgba(76, 201, 160, 0.25),
			inset 0 0 15px rgba(76, 201, 160, 0.1);
		transform: translateY(-2px);
	}

	.crimson {
		background: linear-gradient(135deg, #2a0f12, #1a080a);
		color: var(--crimson);
		border: 2px solid var(--crimson);
		box-shadow:
			0 0 15px rgba(230, 57, 70, 0.1),
			inset 0 0 10px rgba(230, 57, 70, 0.05);
	}
	.crimson:hover:not(:disabled) {
		background: linear-gradient(135deg, #3a1820, #2a0f12);
		box-shadow:
			0 0 25px rgba(230, 57, 70, 0.25),
			inset 0 0 15px rgba(230, 57, 70, 0.1);
		transform: translateY(-2px);
	}

	.pixel-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none !important;
	}

	.spin {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
