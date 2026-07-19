<script>
	import {
		Skull,
		Search,
		Shield,
		Zap,
		Swords,
		Target,
		Info,
		MapPin,
		AlertTriangle
	} from '@lucide/svelte';
	import bossesRaw from '$lib/data/bosses.json';

	// Difficulty table — boss only
	const DIFFICULTIES = [
		{ id: 'easy', label: 'Easy', lvOffset: -10, expHpMult: 0.1, statMult: 0.1 },
		{ id: 'normal', label: 'Normal', lvOffset: 0, expHpMult: 1, statMult: 1 },
		{ id: 'hard', label: 'Hard', lvOffset: +10, expHpMult: 2, statMult: 2 },
		{ id: 'nightmare', label: 'Nightmare', lvOffset: +20, expHpMult: 5, statMult: 4 },
		{ id: 'ultimate', label: 'Ultimate', lvOffset: +40, expHpMult: 10, statMult: 6 }
	];

	const DIFF_COLORS = {
		easy: 'var(--teal)',
		normal: 'var(--text-bright)',
		hard: 'var(--gold)',
		nightmare: '#e07b39',
		ultimate: 'var(--crimson)'
	};

	const ELEMENT_COLOR = {
		Fire: '#e67e22',
		Water: 'var(--blue)',
		Wind: 'var(--teal)',
		Earth: '#a08060',
		Light: 'var(--gold)',
		Dark: 'var(--purple)',
		Neutral: 'var(--text-dim)',
		Shadow: '#6a3f8a'
	};
	const ELEMENT_EMOJI = {
		Fire: '🔥',
		Water: '💧',
		Wind: '🌪️',
		Earth: '🪨',
		Light: '✨',
		Dark: '🌑',
		Neutral: '⚪',
		Shadow: '👥'
	};

	// State
	let searchQuery = $state('');
	let activeType = $state('all'); // 'all' | 'boss' | 'miniboss'
	let activeDiff = $state('normal');
	let expandedBoss = $state(null);
	let activeTab = $state({});

	const TYPE_OPTS = [
		{ id: 'all', label: 'All' },
		{ id: 'boss', label: 'Boss' },
		{ id: 'miniboss', label: 'Mini Boss' }
	];

	function getTab(name) {
		return activeTab[name] ?? 'stats';
	}
	function setTab(name, tab) {
		activeTab = { ...activeTab, [name]: tab };
	}

	const diff = $derived(DIFFICULTIES.find((d) => d.id === activeDiff));

	function resolveFirst(val) {
		if (typeof val === 'number') return val;
		if (val && typeof val === 'object') return Object.values(val)[0];
		return 0;
	}
	function phaseEntries(val) {
		if (typeof val === 'object' && val !== null && !Array.isArray(val)) return Object.entries(val);
		return null;
	}

	function scaledHP(b) {
		return b.type === 'boss' ? Math.round(b.baseHP * diff.expHpMult) : b.baseHP;
	}
	function scaledEXP(b) {
		return b.type === 'boss' ? Math.round(b.baseEXP * diff.expHpMult) : b.baseEXP;
	}
	function scaledDEF(b) {
		return b.type === 'boss'
			? Math.round(resolveFirst(b.stats.def) * diff.statMult)
			: resolveFirst(b.stats.def);
	}
	function scaledMDEF(b) {
		return b.type === 'boss'
			? Math.round(resolveFirst(b.stats.mDef) * diff.statMult)
			: resolveFirst(b.stats.mDef);
	}
	function scaledFlee(b) {
		return b.type === 'boss'
			? Math.round((b.stats.flee ?? 0) * diff.statMult)
			: (b.stats.flee ?? 0);
	}
	function effLv(b) {
		return b.type === 'boss' ? b.level + diff.lvOffset : b.level;
	}

	const filtered = $derived(
		bossesRaw
			.filter((b) => activeType === 'all' || b.type === activeType)
			.filter((b) => {
				if (!searchQuery) return true;
				const q = searchQuery.toLowerCase();
				return (
					b.name.toLowerCase().includes(q) ||
					(b.element ?? '').toLowerCase().includes(q) ||
					(b.location ?? '').toLowerCase().includes(q)
				);
			})
	);

	function toggle(name) {
		expandedBoss = expandedBoss === name ? null : name;
	}

	function hasPhases(b) {
		return b.phases?.length > 0;
	}
	function hasTips(b) {
		return b.tips?.trim();
	}
	function hasParts(b) {
		return b.partDestruction?.trim();
	}
	function hasRetInfo(b) {
		return b.retaliates && b.retaliates !== 'N/A' && b.retaliates !== 'None';
	}
</script>

<svelte:head><title>Boss Info — Toram Lab</title></svelte:head>

<div class="page">
	<div class="page-header">
		<div class="page-title-row">
			<Skull size={22} class="page-title-icon" />
			<div>
				<h1 class="page-title">BOSS INFO</h1>
				<p class="page-subtitle">Stats, phases, retaliates, tips &amp; part destruction</p>
			</div>
		</div>
	</div>

	<!-- Controls -->
	<div class="controls">
		<div class="top-row">
			<div class="search-wrap">
				<Search size={14} class="search-icon" />
				<input
					type="search"
					class="search-input"
					placeholder="Search name, element, location…"
					bind:value={searchQuery}
				/>
			</div>
			<div class="type-tabs">
				{#each TYPE_OPTS as t}
					<button
						class="type-tab {activeType === t.id ? 'active' : ''}"
						onclick={() => {
							activeType = t.id;
						}}
					>
						{t.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Difficulty selector — only meaningful for bosses -->
		{#if activeType !== 'miniboss'}
			<div class="diff-row">
				<span class="diff-label">Boss Difficulty</span>
				<div class="diff-tabs">
					{#each DIFFICULTIES as d}
						<button
							class="diff-tab {activeDiff === d.id ? 'active' : ''}"
							style="--dc: {DIFF_COLORS[d.id]}"
							onclick={() => {
								activeDiff = d.id;
							}}
						>
							{d.label}
						</button>
					{/each}
				</div>
				<span class="diff-hint"
					>Lv {diff.lvOffset >= 0 ? '+' : ''}{diff.lvOffset} · HP/EXP ×{diff.expHpMult} · DEF/MDEF/FLEE
					×{diff.statMult}</span
				>
			</div>
		{/if}
	</div>

	<p class="result-count">{filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'}</p>

	<!-- List -->
	<div class="bosses-list">
		{#each filtered as boss}
			{@const expanded = expandedBoss === boss.name}
			{@const tab = getTab(boss.name)}
			{@const isBoss = boss.type === 'boss'}
			<div class="boss-card {expanded ? 'expanded' : ''} {isBoss ? 'is-boss' : 'is-mini'}">
				<!-- Header -->
				<button class="boss-header" onclick={() => toggle(boss.name)}>
					<div class="boss-icon-wrap">
						<Skull size={16} />
					</div>
					<div class="boss-title-info">
						<div class="boss-name-row">
							<span class="boss-name">{boss.name}</span>
							<span class="type-badge {isBoss ? 'badge-boss' : 'badge-mini'}"
								>{isBoss ? 'BOSS' : 'MINI'}</span
							>
							{#if boss.element}
								<span
									class="elem-badge"
									style="--ec:{ELEMENT_COLOR[boss.element] ?? 'var(--text-dim)'}"
								>
									{ELEMENT_EMOJI[boss.element] ?? ''}
									{boss.element}
								</span>
							{/if}
						</div>
						<span class="boss-sub">
							{#if boss.location}<MapPin size={10} class="loc-pin" /> {boss.location} ·{/if}
							Lv {effLv(boss)}{isBoss && diff.lvOffset !== 0 ? ` (base ${boss.level})` : ''}
							· HP {scaledHP(boss).toLocaleString()}
						</span>
					</div>
					<span class="chevron {expanded ? 'open' : ''}">▾</span>
				</button>

				<!-- Quick pills -->
				<div class="stat-pills">
					<div class="pill">
						<span class="pk">DEF</span><span class="pv">{scaledDEF(boss)}</span>
					</div>
					<div class="pill">
						<span class="pk">MDEF</span><span class="pv">{scaledMDEF(boss)}</span>
					</div>
					<div class="pill">
						<span class="pk">P.RES</span><span class="pv">{resolveFirst(boss.stats.pRes)}%</span>
					</div>
					<div class="pill">
						<span class="pk">M.RES</span><span class="pv">{resolveFirst(boss.stats.mRes)}%</span>
					</div>
					<div class="pill">
						<span class="pk">FLEE</span><span class="pv">{scaledFlee(boss)}</span>
					</div>
					<div class="pill">
						<span class="pk">CRIT.RES</span><span
							class="pv {resolveFirst(boss.stats.critRes) < 0 ? 'neg' : ''}"
							>{resolveFirst(boss.stats.critRes)}</span
						>
					</div>
					{#if hasRetInfo(boss)}
						<div class="pill pill-warn"><span class="pk">⚠ RETALIATE</span></div>
					{/if}
				</div>

				<!-- Expanded -->
				{#if expanded}
					<div class="exp-body">
						<!-- Tab bar -->
						<div class="tab-bar">
							<button
								class="etab {tab === 'stats' ? 'active' : ''}"
								onclick={() => setTab(boss.name, 'stats')}><Swords size={11} /> Stats</button
							>
							{#if hasPhases(boss)}
								<button
									class="etab {tab === 'phases' ? 'active' : ''}"
									onclick={() => setTab(boss.name, 'phases')}><Zap size={11} /> Phases</button
								>
							{/if}
							<button
								class="etab {tab === 'retaliate' ? 'active' : ''}"
								onclick={() => setTab(boss.name, 'retaliate')}
								><Shield size={11} /> Retaliates</button
							>
							{#if hasTips(boss) || hasParts(boss)}
								<button
									class="etab {tab === 'tips' ? 'active' : ''}"
									onclick={() => setTab(boss.name, 'tips')}
									><Info size={11} /> Tips &amp; Parts</button
								>
							{/if}
						</div>

						<!-- Stats -->
						{#if tab === 'stats'}
							<div class="stats-grid">
								<div class="sr">
									<span class="sk">EXP</span><span class="sv gold"
										>{scaledEXP(boss).toLocaleString()}</span
									>
								</div>
								<div class="sr">
									<span class="sk">HP</span><span class="sv red"
										>{scaledHP(boss).toLocaleString()}</span
									>
								</div>
								<div class="sr">
									<span class="sk">Level</span><span class="sv">{effLv(boss)}</span>
								</div>
								<div class="sr">
									<span class="sk">Element</span><span
										class="sv"
										style="color:{ELEMENT_COLOR[boss.element] ?? 'var(--text-bright)'}"
										>{ELEMENT_EMOJI[boss.element] ?? ''} {boss.element ?? '—'}</span
									>
								</div>

								{#each [['DEF', boss.stats.def, isBoss ? diff.statMult : 1], ['MDEF', boss.stats.mDef, isBoss ? diff.statMult : 1]] as [lbl, val, mult]}
									<div class="sr">
										<span class="sk">{lbl}</span>
										<span class="sv ph-val">
											{#if phaseEntries(val)}
												{#each phaseEntries(val) as [k, v]}
													<span class="ph-entry"
														><span class="ph-tag">{k}</span>{Math.round(v * mult)}</span
													>
												{/each}
											{:else}
												{Math.round((val ?? 0) * mult)}
											{/if}
										</span>
									</div>
								{/each}

								{#each [['P.RES', boss.stats.pRes], ['M.RES', boss.stats.mRes]] as [lbl, val]}
									<div class="sr">
										<span class="sk">{lbl}</span>
										<span class="sv ph-val">
											{#if phaseEntries(val)}
												{#each phaseEntries(val) as [k, v]}
													<span class="ph-entry"><span class="ph-tag">{k}</span>{v}%</span>
												{/each}
											{:else}
												{val}%
											{/if}
										</span>
									</div>
								{/each}

								<div class="sr">
									<span class="sk">P.Prorat</span><span class="sv">{boss.stats.pProrat}</span>
								</div>
								<div class="sr">
									<span class="sk">M.Prorat</span><span class="sv">{boss.stats.mProrat}</span>
								</div>
								<div class="sr">
									<span class="sk">N.Prorat</span><span class="sv">{boss.stats.nProrat}</span>
								</div>
								<div class="sr">
									<span class="sk">Crit.Res</span>
									<span class="sv ph-val {resolveFirst(boss.stats.critRes) < 0 ? 'neg' : ''}">
										{#if phaseEntries(boss.stats.critRes)}
											{#each phaseEntries(boss.stats.critRes) as [k, v]}
												<span class="ph-entry"><span class="ph-tag">{k}</span>{v}</span>
											{/each}
										{:else}
											{boss.stats.critRes}
										{/if}
									</span>
								</div>
								<div class="sr">
									<span class="sk">FLEE</span><span class="sv">{scaledFlee(boss)}</span>
								</div>
							</div>

							{#if resolveFirst(boss.stats.critRes) < 0}
								<div class="info-box warn">
									<AlertTriangle size={12} />
									Negative Crit.Res grants +{Math.abs(resolveFirst(boss.stats.critRes))}% critical
									rate to both physical AND magic attacks.
								</div>
							{/if}

							{#if !isBoss}
								<div class="info-box note">
									<Info size={12} />
									Mini bosses have no difficulty scaling — stats shown are base values.
								</div>
							{/if}
						{/if}

						<!-- Phases -->
						{#if tab === 'phases' && hasPhases(boss)}
							<div class="phases-list">
								{#each boss.phases as ph}
									<div class="phase-card">
										<span class="ph-id-badge"><Zap size={10} /> {ph.id}</span>
										<span class="ph-trigger">Trigger: {ph.trigger}</span>
										<p class="ph-desc">{ph.description}</p>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Retaliates -->
						{#if tab === 'retaliate'}
							<div class="ret-block">
								<Shield size={13} class="ret-icon" />
								<p class="ret-text">{boss.retaliates || 'None'}</p>
							</div>
							<div class="legend">
								<span class="lg-title">Abbreviations:</span>
								{#each ['F = Flinched', 'T = Tumbled', 'S = Stunned', 'FTS = Flinched/Tumbled/Stunned', 'TS = Tumbled/Stunned', 'N = Normal', 'EN = Enraged', 'LHP = Low HP', 'PH = Phase'] as entry}
									<span class="ltag">{entry}</span>
								{/each}
							</div>
						{/if}

						<!-- Tips & Parts -->
						{#if tab === 'tips'}
							{#if hasTips(boss)}
								<div class="tips-box">
									<div class="box-label teal"><Info size={11} /> Strategy Tips</div>
									<p class="box-text">{boss.tips}</p>
								</div>
							{/if}
							{#if hasParts(boss)}
								<div class="tips-box parts">
									<div class="box-label gold"><Target size={11} /> Part Destruction</div>
									<p class="box-text">{boss.partDestruction}</p>
								</div>
							{/if}
							{#if !hasTips(boss) && !hasParts(boss)}
								<p class="no-data">No tips or part destruction info yet.</p>
							{/if}
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if filtered.length === 0}
		<div class="empty">
			<Skull size={34} style="opacity:0.25" />
			<p>No results.</p>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 4rem;
	}
	.page-header {
		margin-bottom: 1.5rem;
	}
	.page-title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
	}
	.page-title-row :global(svg) {
		color: var(--crimson);
		margin-top: 4px;
		flex-shrink: 0;
		filter: drop-shadow(0 0 6px rgba(230, 57, 70, 0.4));
	}
	.page-title {
		font-family: var(--pixel);
		font-size: clamp(0.65rem, 2.5vw, 0.95rem);
		color: var(--crimson);
		letter-spacing: 0.06em;
	}
	.page-subtitle {
		font-size: 0.78rem;
		color: var(--text-dim);
		margin-top: 0.3rem;
	}

	/* Controls */
	.controls {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		margin-bottom: 0.75rem;
	}
	.top-row {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: center;
	}
	.search-wrap {
		position: relative;
		flex: 1;
		min-width: 180px;
		max-width: 360px;
	}
	.search-wrap :global(.search-icon) {
		position: absolute;
		left: 0.65rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-dim);
		pointer-events: none;
	}
	.search-input {
		padding-left: 2.1rem !important;
		width: 100%;
	}
	.type-tabs {
		display: flex;
		gap: 0.3rem;
	}
	.type-tab {
		padding: 0.32rem 0.85rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.02);
		color: var(--text-dim);
		font-size: 0.72rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.type-tab:hover {
		border-color: var(--border-glow);
		color: var(--text-bright);
	}
	.type-tab.active {
		border-color: rgba(230, 57, 70, 0.45);
		background: rgba(230, 57, 70, 0.09);
		color: var(--crimson);
		font-weight: 600;
	}

	.diff-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.diff-label {
		font-family: var(--pixel);
		font-size: 0.4rem;
		color: var(--text-dim);
		letter-spacing: 0.06em;
		white-space: nowrap;
	}
	.diff-tabs {
		display: flex;
		gap: 0.28rem;
		flex-wrap: wrap;
	}
	.diff-tab {
		padding: 0.28rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.02);
		color: var(--text-dim);
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.diff-tab:hover {
		border-color: var(--border-glow);
		color: var(--text-bright);
	}
	.diff-tab.active {
		border-color: color-mix(in srgb, var(--dc) 50%, transparent);
		background: color-mix(in srgb, var(--dc) 12%, transparent);
		color: var(--dc);
		font-weight: 600;
	}
	.diff-hint {
		font-size: 0.63rem;
		color: var(--text-dim);
	}

	.result-count {
		font-size: 0.68rem;
		color: var(--text-dim);
		margin-bottom: 0.75rem;
	}

	/* Cards */
	.bosses-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.boss-card {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 11px;
		padding: 0.8rem 0.95rem;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		transition: border-color 0.2s;
	}
	.boss-card:hover {
		border-color: color-mix(in srgb, var(--border-glow) 60%, transparent);
	}
	.boss-card.expanded {
		border-color: rgba(230, 57, 70, 0.35);
	}
	.is-mini.expanded {
		border-color: rgba(76, 201, 160, 0.3);
	}

	.boss-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: none;
		border: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
		padding: 0;
		color: inherit;
	}
	.boss-icon-wrap {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: rgba(230, 57, 70, 0.07);
		border: 1px solid rgba(230, 57, 70, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--crimson);
		flex-shrink: 0;
	}
	.is-mini .boss-icon-wrap {
		background: rgba(76, 201, 160, 0.07);
		border-color: rgba(76, 201, 160, 0.2);
		color: var(--teal);
	}
	.boss-title-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.22rem;
	}
	.boss-name-row {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}
	.boss-name {
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text-bright);
	}
	.type-badge {
		font-family: var(--pixel);
		font-size: 0.38rem;
		padding: 2px 7px;
		border-radius: 3px;
		letter-spacing: 0.05em;
	}
	.badge-boss {
		background: rgba(230, 57, 70, 0.12);
		border: 1px solid rgba(230, 57, 70, 0.3);
		color: var(--crimson);
	}
	.badge-mini {
		background: rgba(76, 201, 160, 0.1);
		border: 1px solid rgba(76, 201, 160, 0.25);
		color: var(--teal);
	}
	.elem-badge {
		font-size: 0.63rem;
		font-weight: 600;
		padding: 1px 7px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--ec) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--ec) 30%, transparent);
		color: var(--ec);
	}
	.boss-sub {
		font-size: 0.68rem;
		color: var(--text-dim);
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.boss-sub :global(.loc-pin) {
		color: var(--text-dim);
		flex-shrink: 0;
	}
	.chevron {
		color: var(--text-dim);
		font-size: 0.85rem;
		transition: transform 0.2s;
	}
	.chevron.open {
		transform: rotate(180deg);
	}

	/* Stat pills */
	.stat-pills {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.pill {
		display: flex;
		flex-direction: column;
		gap: 0.08rem;
		padding: 0.3rem 0.55rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border);
		border-radius: 5px;
		min-width: 56px;
	}
	.pill-warn {
		border-color: rgba(230, 57, 70, 0.3);
		background: rgba(230, 57, 70, 0.06);
	}
	.pk {
		font-family: var(--pixel);
		font-size: 0.35rem;
		color: var(--text-dim);
		letter-spacing: 0.04em;
	}
	.pill-warn .pk {
		color: var(--crimson);
	}
	.pv {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-bright);
	}
	.pv.neg {
		color: var(--crimson);
	}

	/* Expanded body */
	.exp-body {
		border-top: 1px solid var(--border);
		padding-top: 0.7rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}
	.tab-bar {
		display: flex;
		gap: 0.28rem;
		flex-wrap: wrap;
	}
	.etab {
		display: flex;
		align-items: center;
		gap: 0.28rem;
		padding: 0.28rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 5px;
		background: rgba(255, 255, 255, 0.02);
		color: var(--text-dim);
		font-size: 0.68rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.etab:hover {
		border-color: var(--border-glow);
		color: var(--text-bright);
	}
	.etab.active {
		border-color: rgba(230, 57, 70, 0.4);
		background: rgba(230, 57, 70, 0.07);
		color: var(--crimson);
	}
	.etab :global(svg) {
		flex-shrink: 0;
	}

	/* Stats grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
		gap: 0.28rem;
	}
	.sr {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.28rem 0.55rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 4px;
	}
	.sk {
		font-size: 0.65rem;
		color: var(--text-dim);
	}
	.sv {
		font-size: 0.73rem;
		font-weight: 600;
		color: var(--text-bright);
	}
	.sv.gold {
		color: var(--gold);
	}
	.sv.red {
		color: var(--crimson);
	}
	.sv.neg {
		color: var(--crimson);
	}
	.ph-val {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
	.ph-entry {
		display: flex;
		align-items: center;
		gap: 0.18rem;
	}
	.ph-tag {
		font-family: var(--pixel);
		font-size: 0.33rem;
		padding: 1px 5px;
		background: rgba(230, 57, 70, 0.1);
		border: 1px solid rgba(230, 57, 70, 0.22);
		border-radius: 3px;
		color: var(--crimson);
	}

	.info-box {
		display: flex;
		align-items: flex-start;
		gap: 0.4rem;
		padding: 0.5rem 0.7rem;
		border-radius: 6px;
		font-size: 0.68rem;
		line-height: 1.4;
	}
	.info-box.warn {
		background: rgba(230, 57, 70, 0.05);
		border: 1px solid rgba(230, 57, 70, 0.18);
		color: var(--text-muted);
	}
	.info-box.note {
		background: rgba(76, 201, 160, 0.05);
		border: 1px solid rgba(76, 201, 160, 0.15);
		color: var(--text-muted);
	}
	.info-box :global(svg) {
		flex-shrink: 0;
		margin-top: 1px;
	}
	.info-box.warn :global(svg) {
		color: var(--crimson);
	}
	.info-box.note :global(svg) {
		color: var(--teal);
	}

	/* Phases */
	.phases-list {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.phase-card {
		padding: 0.6rem 0.8rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 7px;
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
	}
	.ph-id-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		font-family: var(--pixel);
		font-size: 0.38rem;
		padding: 2px 7px;
		background: rgba(246, 180, 30, 0.1);
		border: 1px solid rgba(246, 180, 30, 0.28);
		border-radius: 3px;
		color: var(--gold);
		width: fit-content;
	}
	.ph-id-badge :global(svg) {
		color: var(--gold);
	}
	.ph-trigger {
		font-size: 0.67rem;
		color: var(--text-dim);
	}
	.ph-desc {
		font-size: 0.73rem;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
	}

	/* Retaliates */
	.ret-block {
		display: flex;
		gap: 0.55rem;
		padding: 0.7rem 0.85rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 7px;
		align-items: flex-start;
	}
	.ret-block :global(.ret-icon) {
		color: var(--teal);
		flex-shrink: 0;
		margin-top: 2px;
	}
	.ret-text {
		font-size: 0.73rem;
		color: var(--text-muted);
		line-height: 1.55;
		margin: 0;
	}
	.legend {
		display: flex;
		gap: 0.28rem;
		flex-wrap: wrap;
		align-items: center;
	}
	.lg-title {
		font-size: 0.63rem;
		color: var(--text-dim);
	}
	.ltag {
		font-size: 0.6rem;
		padding: 1px 5px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 3px;
		color: var(--text-dim);
	}

	/* Tips */
	.tips-box {
		padding: 0.6rem 0.8rem;
		border-radius: 7px;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.tips-box:not(.parts) {
		background: rgba(76, 201, 160, 0.04);
		border: 1px solid rgba(76, 201, 160, 0.14);
	}
	.tips-box.parts {
		background: rgba(246, 180, 30, 0.04);
		border: 1px solid rgba(246, 180, 30, 0.14);
	}
	.box-label {
		display: flex;
		align-items: center;
		gap: 0.28rem;
		font-family: var(--pixel);
		font-size: 0.38rem;
		letter-spacing: 0.05em;
	}
	.box-label.teal {
		color: var(--teal);
	}
	.box-label.teal :global(svg) {
		color: var(--teal);
	}
	.box-label.gold {
		color: var(--gold);
	}
	.box-label.gold :global(svg) {
		color: var(--gold);
	}
	.box-text {
		font-size: 0.73rem;
		color: var(--text-muted);
		line-height: 1.55;
		margin: 0;
	}
	.no-data {
		font-size: 0.73rem;
		color: var(--text-dim);
		padding: 0.4rem 0;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 4rem;
		color: var(--text-dim);
		font-size: 0.82rem;
	}
</style>
