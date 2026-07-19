<script>
	import { ChevronRight } from '@lucide/svelte';

	let {
		children,
		title = '',
		subtitle = '',
		icon: Icon = undefined,
		accent = 'gold',
		onclick = undefined
	} = $props();

	const accentMap = {
		gold: 'var(--gold)',
		teal: 'var(--teal)',
		blue: 'var(--blue)',
		purple: 'var(--purple)',
		crimson: 'var(--crimson)'
	};
</script>

<div
	class="pixel-card"
	class:clickable={onclick !== undefined}
	style="--accent: {accentMap[accent] || accentMap.gold}"
	{onclick}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
	onkeydown={(e) => {
		if (onclick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onclick();
		}
	}}
>
	<div class="card-shine"></div>

	{#if Icon || title || subtitle}
		<div class="card-header">
			{#if Icon}
				<div class="card-icon-wrap">
					<Icon size={20} />
				</div>
			{/if}
			<div class="card-titles">
				{#if title}<h3 class="card-title">{title}</h3>{/if}
				{#if subtitle}<p class="card-subtitle">{subtitle}</p>{/if}
			</div>
			{#if onclick}
				<ChevronRight size={16} class="card-arrow" />
			{/if}
		</div>
	{/if}

	<div class="card-body">
		{@render children()}
	</div>

	<div class="card-border-glow"></div>
</div>

<style>
	.pixel-card {
		position: relative;
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
		transition:
			transform 0.25s,
			box-shadow 0.25s,
			border-color 0.25s;
	}

	.pixel-card.clickable {
		cursor: pointer;
	}
	.pixel-card.clickable:hover {
		transform: translateY(-3px);
		border-color: var(--accent);
		box-shadow:
			0 8px 30px rgba(0, 0, 0, 0.3),
			0 0 20px color-mix(in srgb, var(--accent) 15%, transparent);
	}
	.pixel-card.clickable:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.card-shine {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			transparent 40%,
			rgba(255, 255, 255, 0.03) 50%,
			transparent 60%
		);
		pointer-events: none;
	}

	.card-border-glow {
		position: absolute;
		inset: -1px;
		border-radius: 6px;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s;
		box-shadow: inset 0 0 20px color-mix(in srgb, var(--accent) 20%, transparent);
	}
	.pixel-card:hover .card-border-glow {
		opacity: 1;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.1rem 0 1.1rem;
	}

	.card-icon-wrap {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border);
		color: var(--accent);
		flex-shrink: 0;
	}

	.card-titles {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-family: var(--pixel);
		font-size: 0.6rem;
		color: var(--text-bright);
		letter-spacing: 0.04em;
		margin: 0;
	}

	.card-subtitle {
		font-size: 0.75rem;
		color: var(--text-dim);
		margin: 0.2rem 0 0 0;
	}

	.card-arrow {
		flex-shrink: 0;
		color: var(--accent);
		opacity: 0.5;
		transition:
			opacity 0.2s,
			transform 0.2s;
	}
	.pixel-card:hover .card-arrow {
		opacity: 1;
		transform: translateX(3px);
	}

	.card-body {
		padding: 1rem 1.1rem;
		color: var(--text-mid);
		font-size: 0.85rem;
		line-height: 1.6;
	}
</style>
