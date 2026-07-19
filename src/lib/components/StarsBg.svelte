<script>
	let { density = 30, color = '#4a5a7a', speed = 1 } = $props();

	let stars = $state([]);
	let mounted = $state(false);

	$effect(() => {
		const count = density;
		const arr = [];
		for (let i = 0; i < count; i++) {
			arr.push({
				id: i,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: Math.random() * 2 + 0.5,
				opacity: Math.random() * 0.8 + 0.2,
				delay: Math.random() * 3,
				duration: Math.random() * 2 + 1,
				twinkle: Math.random() > 0.6
			});
		}
		stars = arr;
		mounted = true;
	});
</script>

{#if mounted}
	<div class="stars-bg" aria-hidden="true">
		{#each stars as star (star.id)}
			<div
				class="star"
				class:twinkle={star.twinkle}
				style="left: {star.x}%; top: {star.y}%; width: {star.size}px; height: {star.size}px; opacity: {star.opacity}; animation-delay: {star.delay}s; animation-duration: {star.duration}s; --speed: {speed};"
			></div>
		{/each}
	</div>
{/if}

<style>
	.stars-bg {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		overflow: hidden;
	}

	.star {
		position: absolute;
		border-radius: 50%;
		background: white;
		animation: twinkle var(--duration, 2s) ease-in-out infinite;
		animation-delay: var(--delay, 0s);
		will-change: opacity;
	}

	.star.twinkle {
		animation: twinkle-alt calc(var(--duration, 2s) * 1.5) ease-in-out infinite;
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	@keyframes twinkle-alt {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(0.9);
		}
		33% {
			opacity: 0.7;
			transform: scale(1.3);
		}
		66% {
			opacity: 0.1;
			transform: scale(0.6);
		}
	}
</style>
