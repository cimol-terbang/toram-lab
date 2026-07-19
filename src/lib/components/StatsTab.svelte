<script>
	import { activeBuild, setStat } from '$lib/stores/buildStore.js';
	import { computeCharacterStats } from '$lib/application/character-stat.js';
	import AllStatsList from './AllStatsList.svelte';
	import { Activity, TrendingUp, Zap } from '@lucide/svelte';

	const PERSONAL_STATS = [
		{ key: 'crt', label: 'CRT', desc: 'Critical Rate — raises CR' },
		{ key: 'luk', label: 'LUK', desc: 'Luck — drop & ailment' },
		{ key: 'mtl', label: 'MTL', desc: 'Mentality — ailment resist' },
		{ key: 'tec', label: 'TEC', desc: 'Technique — MaxMP & misc' }
	];
	const MAIN_STATS = [
		{ key: 'str', label: 'STR', color: '#f4c542', tip: 'Physical ATK, Stability' },
		{ key: 'dex', label: 'DEX', color: '#4a9eff', tip: 'ATK, Accuracy, ASPD, Stability' },
		{ key: 'int', label: 'INT', color: '#9b72cf', tip: 'MATK, MDEF, MaxMP' },
		{ key: 'vit', label: 'VIT', color: '#4cc9a0', tip: 'MaxHP, DEF, MDEF' },
		{ key: 'agi', label: 'AGI', color: '#e67e22', tip: 'ASPD, Dodge, CSPD, Motion Speed' }
	];

	let build = $derived($activeBuild);
	let stat = $derived(build.stat);
	let total = $derived(computeCharacterStats(build));
	const totalMain = $derived(stat.str + stat.dex + stat.int + stat.vit + stat.agi);
	const totalPersonal = $derived(stat.personalValue);

	function clampStat(val, min = 0, max = 9999) {
		const n = parseInt(val);
		if (isNaN(n)) return min;
		return Math.min(max, Math.max(min, n));
	}
	function onStatInput(key, e) {
		setStat(key, clampStat(e.target.value, 0, 9999));
	}
	function onLevelInput(e) {
		setStat('level', clampStat(e.target.value, 1, 340));
	}
	function setPersonalType(key) {
		setStat('personalType', key);
	}
</script>

<div class="stat-layout">
	<div class="stat-left">
		<div class="section-card">
			<div class="section-label"><TrendingUp size={13} /><span>CHARACTER LEVEL</span></div>
			<div class="level-row">
				<input
					type="number"
					class="level-input"
					value={stat.level}
					min="1"
					max="340"
					oninput={onLevelInput}
				/>
				<span class="level-max">/ 340</span>
				<div class="level-bar-wrap">
					<div class="level-bar" style="width: {(stat.level / 340) * 100}%"></div>
				</div>
			</div>
		</div>

		<div class="section-card">
			<div class="section-label">
				<Activity size={13} /><span>MAIN STATS</span>
				<span class="pts-badge">{totalMain} pts</span>
			</div>
			<div class="main-stats-grid">
				{#each MAIN_STATS as s (s.key)}
					{@const val = stat[s.key]}
					<div class="stat-row" style="--scolor: {s.color}">
						<div class="stat-label-col">
							<span class="stat-key">{s.label}</span>
							<span class="stat-tip">{s.tip}</span>
						</div>
						<div class="stat-controls">
							<button
								class="stat-btn minus"
								onclick={() => setStat(s.key, Math.max(0, val - 1))}
								disabled={val <= 0}>−</button
							>
							<input
								type="number"
								class="stat-num-input"
								value={val}
								min="0"
								max="9999"
								oninput={(e) => onStatInput(s.key, e)}
							/>
							<button class="stat-btn plus" onclick={() => setStat(s.key, val + 1)}>+</button>
						</div>
						<div class="stat-bar-wrap">
							<div
								class="stat-bar"
								style="width: {Math.min(
									100,
									(val / Math.max(totalMain, 1)) * 100
								)}%; background: {s.color}"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="section-card">
			<div class="section-label">
				<span>PERSONAL STAT</span><span class="pts-badge">{totalPersonal} pts</span>
			</div>
			<p class="personal-hint">Choose one personal stat type.</p>
			<div class="personal-tabs">
				{#each PERSONAL_STATS as ps (ps.key)}
					<button
						class="personal-tab {stat.personalType === ps.key ? 'active' : ''}"
						onclick={() => setPersonalType(ps.key)}
					>
						<span class="ptab-key">{ps.label}</span>
						<span class="ptab-desc">{ps.desc}</span>
					</button>
				{/each}
			</div>
			<div class="personal-input-row">
				<button
					class="stat-btn minus"
					onclick={() => setStat('personalValue', Math.max(0, stat.personalValue - 1))}
					disabled={stat.personalValue <= 0}>−</button
				>
				<input
					type="number"
					class="stat-num-input personal-num"
					value={stat.personalValue}
					min="0"
					max="9999"
					oninput={(e) => setStat('personalValue', clampStat(e.target.value))}
				/>
				<button
					class="stat-btn plus"
					onclick={() => setStat('personalValue', stat.personalValue + 1)}>+</button
				>
			</div>
		</div>
	</div>

	<div class="stat-right">
		<div class="summary-card">
			<AllStatsList total={total} showAll={true} />
		</div>
	</div>
</div>

<style>
	.stat-layout {
		display: grid;
		grid-template-columns: 1fr 240px;
		gap: 1rem;
		align-items: start;
	}
	.stat-left {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.section-card {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.section-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--pixel);
		font-size: 0.5rem;
		color: var(--gold);
		letter-spacing: 0.08em;
	}
	.section-label :global(svg) {
		color: var(--gold);
	}
	.pts-badge {
		margin-left: auto;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--teal);
		background: rgba(76, 201, 160, 0.08);
		border: 1px solid rgba(76, 201, 160, 0.25);
		border-radius: 4px;
		padding: 2px 8px;
	}
	.level-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.level-input {
		width: 80px;
		max-width: 30vw;
		text-align: center;
		font-size: 1.6rem !important;
		font-weight: 800 !important;
		color: var(--gold) !important;
		border-color: rgba(244, 197, 66, 0.3) !important;
		background: rgba(244, 197, 66, 0.05) !important;
		padding: 0.4rem !important;
	}
	.level-max {
		font-size: 0.7rem;
		color: var(--text-dim);
		white-space: nowrap;
	}
	.level-bar-wrap {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 2px;
		overflow: hidden;
	}
	.level-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--gold), #f4c542aa);
		border-radius: 2px;
		transition: width 0.3s;
	}
	.main-stats-grid {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}
	.stat-row {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto 4px;
		column-gap: 0.75rem;
		row-gap: 0.35rem;
		align-items: center;
	}
	.stat-label-col {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.stat-key {
		font-family: var(--pixel);
		font-size: 0.58rem;
		color: var(--scolor);
		letter-spacing: 0.04em;
	}
	.stat-tip {
		font-size: 0.6rem;
		color: var(--text-dim);
	}
	.stat-controls {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.stat-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 5px;
		color: var(--text-mid);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		line-height: 1;
	}
	.stat-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-bright);
	}
	.stat-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.stat-btn.plus:hover:not(:disabled) {
		border-color: var(--teal);
		color: var(--teal);
	}
	.stat-btn.minus:hover:not(:disabled) {
		border-color: var(--crimson);
		color: var(--crimson);
	}
	.stat-num-input {
		width: 70px;
		max-width: 25vw;
		text-align: center;
		font-size: 1rem !important;
		font-weight: 700 !important;
		color: var(--text-bright) !important;
		padding: 4px 6px !important;
	}
	.stat-bar-wrap {
		grid-column: 1 / -1;
		height: 3px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 2px;
		overflow: hidden;
	}
	.stat-bar {
		height: 100%;
		border-radius: 2px;
		transition: width 0.3s;
		opacity: 0.7;
	}
	.personal-hint {
		font-size: 0.7rem;
		color: var(--text-dim);
		margin: -0.4rem 0 0;
	}
	.personal-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem;
	}
	.personal-tab {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.5rem 0.65rem;
		border-radius: 7px;
		border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.02);
		cursor: pointer;
		text-align: left;
		transition: all 0.15s;
	}
	.personal-tab:hover {
		border-color: var(--border-glow);
		background: rgba(255, 255, 255, 0.04);
	}
	.personal-tab.active {
		border-color: rgba(76, 201, 160, 0.5);
		background: rgba(76, 201, 160, 0.07);
	}
	.ptab-key {
		font-family: var(--pixel);
		font-size: 0.55rem;
		color: var(--text-bright);
		letter-spacing: 0.04em;
	}
	.personal-tab.active .ptab-key {
		color: var(--teal);
	}
	.ptab-desc {
		font-size: 0.6rem;
		color: var(--text-dim);
	}
	.personal-input-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
	}
	.personal-num {
		flex: 1 !important;
		width: auto !important;
		max-width: none !important;
	}

	/* ─── Summary card ─── */
	.summary-card {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 0.9rem;
		position: sticky;
		top: 70px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.sync-note {
		display: flex;
		align-items: flex-start;
		gap: 0.4rem;
		font-size: 0.6rem;
		color: var(--text-dim);
		line-height: 1.4;
		border-top: 1px solid var(--border);
		padding-top: 0.6rem;
	}
	.sync-note :global(svg) {
		color: var(--teal);
		flex-shrink: 0;
		margin-top: 1px;
	}

	@media (max-width: 700px) {
		.stat-layout {
			grid-template-columns: 1fr;
		}
		.summary-card {
			position: static;
		}
	}
	@media (max-width: 480px) {
		.stat-row {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto 4px;
		}
		.stat-controls {
			justify-self: end;
		}
		.personal-tabs {
			grid-template-columns: 1fr;
		}
	}
</style>