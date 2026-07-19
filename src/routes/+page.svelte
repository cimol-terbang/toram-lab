<script>
	import { Modal, PixelButton, PixelCard, StarsBg, Toast } from '$lib/components';
	import { Beaker, Crosshair, Shield, Zap, Info, ScrollText, FlaskConical, Skull, ExternalLink, Users, BookOpen } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import logoSrc from '$lib/assets/logo.png';

	let showAbout = $state(false);
	let showCredits = $state(false);
	let showToast = $state(false);

	const features = [
		{
			id: 'calc',
			href: '/calc',
			icon: Beaker,
			title: 'Damage Calculator',
			subtitle: 'Precision RPG math',
			accent: 'gold',
			detail: 'Input your stats, equipment, and buffs to get exact damage estimates. Supports auto-attack, skill damage, crit calculations, and damage caps, all based on Toram Online formulas.',
		},
		{
			id: 'stats',
			href: '/stats',
			icon: Crosshair,
			title: 'Stat Optimizer',
			subtitle: 'Perfect your spread',
			accent: 'teal',
			detail: 'Find the optimal stat distribution for your build. Compare STR vs DEX vs INT allocations and see how each point affects your final DPS.',
		},
		{
			id: 'equipment',
			href: '/equipment',
			icon: Shield,
			title: 'Equipment Planner',
			subtitle: 'Equip with purpose',
			accent: 'blue',
			detail: 'Browse weapons, armors, and accessories. Plan your loadout with detailed stat breakdowns and crysta slots. Lazy-loads item data for fast startup.',
		},
		{
			id: 'buff',
			href: '/buff',
			icon: FlaskConical,
			title: 'Buff Planner',
			subtitle: 'Passives, actives & food',
			accent: 'purple',
			detail: 'Plan your skill buffs, passive abilities, and food buffs. See how each buff interacts with your stats and total damage output.',
		},
		{
			id: 'items',
			href: '/items',
			icon: ScrollText,
			title: 'Item Database',
			subtitle: 'All gear at a glance',
			accent: 'purple',
			detail: 'Search and filter weapons, armors, and accessories. View stats, set bonuses, and refine your loadout without leaving the lab.',
		},
		{
			id: 'boss',
			href: '/boss',
			icon: Skull,
			title: 'Boss Info',
			subtitle: 'Know your enemy',
			accent: 'crimson',
			detail: 'Browse boss defenses, resistances. Prepare the perfect counter-build for any encounter.',
		},
		{
			id: 'builds',
			href: '/builds',
			icon: BookOpen,
			title: 'My Builds',
			subtitle: '10 save slots',
			accent: 'gold',
			detail: 'Save up to 10 build configurations locally. Each slot auto-saves as you make changes — your builds stay even after closing the browser.',
		},
	];

	function startBuild(e) {
		e?.preventDefault();
		goto('/character-builder');
	}
</script>

<svelte:head>
	<title>Toram Build Lab</title>
</svelte:head>

<StarsBg density={40} />

<!-- ─── HERO ─── -->
<section class="hero">
	<div class="hero-content">
		<div class="hero-logo">
			<div class="logo-icon-wrap">
				<img src={logoSrc} alt="Toram Build Lab" class="hero-logo-img" />
			</div>
			<h1 class="hero-title">
				TORAM<br />
				<span class="hero-sub">BUILD LAB</span>
			</h1>
		</div>
		<p class="hero-tagline">Simulate your own build. Prove your damage.</p>
		<div class="hero-actions">
		<PixelButton onclick={startBuild} size="lg">
				<Zap size={16} />
				START BUILD
			</PixelButton>
			<PixelButton onclick={() => { showAbout = true; }} variant="teal" size="lg">
				<Info size={16} />
				ABOUT
			</PixelButton>
			<PixelButton onclick={() => { showCredits = true; }} variant="purple" size="lg">
				<Users size={16} />
				CREDITS
			</PixelButton>
		</div>
	</div>

	<div class="scroll-hint">
		<div class="scroll-arrow-row">
			<svg width="20" height="14" viewBox="0 0 12 8" fill="none">
				<path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
			<svg width="20" height="14" viewBox="0 0 12 8" fill="none" class="scroll-arrow-2">
				<path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
		</div>
		<span class="scroll-label"></span>
	</div>
</section>

<!-- ─── FEATURES ─── -->
<section class="features-section">
	<div class="features-grid">
		{#each features as feat (feat.id)}
			<PixelCard
				title={feat.title}
				subtitle={feat.subtitle}
				icon={feat.icon}
				accent={feat.accent}
			>
				<p>{feat.detail}</p>
			</PixelCard>
		{/each}
	</div>
</section>

<!-- ─── ABOUT MODAL ─── -->
<Modal title="About Toram Build Lab" open={showAbout} onclose={() => { showAbout = false; }}>
	<div class="about-content">
		<p>
			<strong>Toram Build Lab</strong> is a fan-made damage calculator and build planner for
			<em>Toram Online</em> — the mobile action MMORPG by Asobimo.
		</p>
		<p>
			All formulas are researched and verified against in-game data. This tool helps you
			optimize your stats, plan your gear, and understand the math behind your damage.
		</p>
		<p class="about-note">
			<Info size={14} />
			Not affiliated with Asobimo. For educational & community purposes.
		</p>
		<div class="about-actions">
			<a href="https://haotian.my.id" target="_blank" rel="noopener" class="credit-btn">
				<ExternalLink size={14} />
				<span>Created by Haotian</span>
			</a>
		</div>
	</div>
</Modal>

<!-- ─── CREDITS MODAL ─── -->
<Modal title="Contributors" open={showCredits} onclose={() => { showCredits = false; }}>
	<div class="credits-content">
		<p class="credits-intro">Thanks to everyone who contributed formulas, data, and testing:</p>
		<ul class="credits-list">
			<li><strong>Haotian</strong> — Lead dev, formula implementation, UI/UX</li>
			<li><strong>Toram Community</strong> — Formula research & in-game verification</li>
			<li><strong>Coryn Club</strong> — Data reference & item database</li>
			<li><strong>Asobimo</strong> — For creating Toram Online</li>
		</ul>
		<p class="credits-outro">If you'd like to contribute, reach out via <a href="https://haotian.my.id" target="_blank" rel="noopener">haotian.my.id</a>.</p>
		<div class="credits-close">
			<PixelButton onclick={() => { showCredits = false; }} variant="teal" size="sm">CLOSE</PixelButton>
		</div>
	</div>
</Modal>

<Toast
	message="⚔ Welcome to Toram Build Lab! Forge your legend."
	type="success"
	visible={showToast}
	onclose={() => { showToast = false; }}
/>

<style>
	.hero {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		background: radial-gradient(ellipse at 50% 35%, #1a1033 0%, #080c14 70%);
	}

	.hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		margin-top: -2rem;
	}

	.hero-logo { margin-bottom: 0.75rem; }

	.logo-icon-wrap {
		display: inline-flex;
		margin-bottom: 1rem;
		animation: float 3s ease-in-out infinite;
	}

	.hero-logo-img {
		width: 64px;
		height: 64px;
		image-rendering: pixelated;
		filter: drop-shadow(0 0 15px rgba(212, 168, 48, 0.35));
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-10px); }
	}

	.hero-title {
		font-family: var(--pixel);
		font-size: clamp(1.8rem, 6vw, 3.2rem);
		line-height: 1.3;
		color: #d4a830;
		text-shadow: 4px 4px 0 #8a7020, 0 0 35px rgba(212, 168, 48, 0.3);
	}

	.hero-sub {
		font-size: clamp(1rem, 3vw, 1.6rem);
		color: #c8b89a;
		text-shadow: 2px 2px 0 var(--text-dim);
	}

	.hero-tagline {
		font-size: 1rem;
		color: var(--text-mid);
		margin-bottom: 2rem;
		letter-spacing: 0.05em;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.scroll-hint {
		position: absolute;
		bottom: 0.8rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		color: #c49a30;
		animation: bobDown 2.4s ease-in-out infinite;
		pointer-events: none;
	}

	.scroll-arrow-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
	}

	.scroll-arrow-row svg { width: 22px; height: 14px; opacity: 0.85; }

	.scroll-arrow-2 {
		margin-top: -5px;
		animation: fadeDelay 2.4s ease-in-out infinite;
	}

	@keyframes fadeDelay {
		0%, 25% { opacity: 0.1; }
		55%, 100% { opacity: 0.9; }
	}

	.scroll-label {
		font-family: var(--pixel);
		font-size: 0.6rem;
		letter-spacing: 0.25em;
		color: #8a7a5a;
		opacity: 0.7;
		margin-top: 0.1rem;
	}

	@keyframes bobDown {
		0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.2; }
		50% { transform: translateX(-50%) translateY(8px); opacity: 0.85; }
	}

	.features-section {
		max-width: 1100px;
		margin: 0 auto 4rem;
		padding: 1.5rem;
		position: relative;
		z-index: 1;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 0.6rem;
	}

	/* Modals */
	.about-content { display: flex; flex-direction: column; gap: 1rem; }
	.about-content p { font-size: 0.85rem; line-height: 1.7; }
	.about-content strong { color: var(--text-bright); }
	.about-content em { color: var(--teal); font-style: normal; }

	.about-note {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem !important;
		color: var(--text-dim);
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: rgba(244, 197, 66, 0.03);
	}

	.about-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }

	.credit-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1.2rem;
		background: linear-gradient(135deg, #1a2845, #0f1626);
		color: var(--teal);
		border: 1px solid var(--teal-dim);
		border-radius: 4px;
		font-family: var(--pixel);
		font-size: 0.6rem;
		text-decoration: none;
		transition: all 0.2s;
	}
	.credit-btn:hover { background: linear-gradient(135deg, #2a3855, #1a2845); box-shadow: 0 0 15px rgba(76, 201, 160, 0.25); }

	.credits-content { display: flex; flex-direction: column; gap: 1rem; }
	.credits-intro { font-size: 0.85rem; color: var(--text-mid); }

	.credits-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.credits-list li {
		font-size: 0.8rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 4px;
		line-height: 1.5;
	}

	.credits-list li strong { color: var(--text-bright); }
	.credits-outro { font-size: 0.8rem; color: var(--text-dim); }
	.credits-outro a { color: var(--teal); text-decoration: none; }
	.credits-outro a:hover { text-decoration: underline; }
	.credits-close { display: flex; justify-content: flex-end; }

	@media (max-width: 640px) {
		.hero-actions { flex-direction: column; align-items: stretch; }
		.features-grid { grid-template-columns: 1fr; }
	}

	@media (max-width: 480px) {
		.features-section { padding: 1rem 0.75rem; }
	}
</style>
