<script>
	import { Swords, Target, Info, Skull, Zap, Shield, Link, Settings } from '@lucide/svelte';
	import { computeStats } from '$lib/application/character-stat.js';
	import { buildToCharacter } from '$lib/application/character-builder.js';
	import { calcDamage } from '$lib/application/damage-calculator.js';
	import { WEAPON_CONTRIBUTIONS, WEAPON_TYPES } from '$lib/domain/constants/weapon-types.js';
	import { Character } from '$lib/domain/character.js';
	import bossesRaw from '$lib/data/bosses.json';
	import { activeBuild } from '$lib/stores/buildStore.js';

	// ─── Difficulty table (boss only) ───────────────────────────────────
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

	// ─── Helpers ─────────────────────────────────────────────────────────
	function resolveFirst(v) {
		if (typeof v === 'number') return v;
		if (v && typeof v === 'object') return Object.values(v)[0];
		return 0;
	}

	// ─── Stats source: buildStore via buildToCharacter ───────────────────
	const build = $derived($activeBuild);
	const level = $derived(build.stat.level);

	// Detect weapon from equipped item
	const equippedWeaponItem = $derived(build.equipment?.weapon?.item);
	const equippedWeaponType = $derived(equippedWeaponItem?.type ?? null);
	const hasEquippedWeapon = $derived(!!equippedWeaponItem);

	// Equipment source mode: 'build' (from character builder) or 'manual'
	let equipSource = $state('build');

	// Manual equipment overrides (used when equipSource === 'manual')
	let manualWeaponType = $state('twoHandedSword');
	let manualBaseAtk = $state(200);
	let manualRefine = $state(15);
	let manualBaseDef = $state(100);
	let manualArmorRef = $state(9);
	let manualAtkPct = $state(0);
	let manualFlatAtk = $state(0);
	let manualWatkPct = $state(0);
	let manualFlatWatk = $state(0);

	const activeWeaponType = $derived(equipSource === 'build' ? (equippedWeaponType ?? 'oneHandedSword') : manualWeaponType);

	// ─── Blade Skill Presets ─────────────────────────────────────────────
	let selectedSkillPreset = $state('custom');
	let skillPresetLevel = $state(10);
	let shutOutAilment = $state('none'); // 'none' or 'active'

	const presetValues = $derived.by(() => {
		if (selectedSkillPreset === 'custom') return null;

		const lv = skillPresetLevel;
		const is1H = activeWeaponType === 'oneHandedSword';

		switch (selectedSkillPreset) {
			case 'hardHit':
				return {
					mult: 100 + 10 * lv,
					const: 50 + 5 * lv,
					mp: 200,
					range: 'short',
					pierce: 0
				};
			case 'astute':
				return {
					mult: 200 + 10 * lv,
					const: 150 + 10 * lv,
					mp: 200,
					range: 'short',
					pierce: 0
				};
			case 'triggerSlash':
				return {
					mult: 200 + 10 * lv,
					const: 100 + 10 * lv,
					mp: 300,
					range: 'short',
					pierce: 0
				};
			case 'meteorBreaker':
				return {
					mult: is1H ? (300 + 30 * lv) * 2 : (300 + 40 * lv) * 2,
					const: is1H ? (100 + 10 * lv) * 2 : (200 + 20 * lv) * 2,
					mp: 600,
					range: 'short',
					pierce: 0
				};
			case 'busterBlade':
				return {
					mult: is1H ? 300 + 50 * lv : 600 + 60 * lv,
					const: is1H ? 100 + 10 * lv : 200 + 20 * lv,
					mp: 300,
					range: 'short',
					pierce: 0
				};
			case 'shutOut': {
				const baseMult = is1H ? 300 + 20 * lv : 400 + 40 * lv;
				const baseConst = is1H ? 150 + 15 * lv : 300 + 30 * lv;
				const isAilment = shutOutAilment === 'active';
				return {
					mult: isAilment ? baseMult * 2 : baseMult,
					const: isAilment ? baseConst * 2 : baseConst,
					mp: 200,
					range: 'short',
					pierce: 0
				};
			}
			case 'gladioVain':
				return {
					mult: is1H ? 400 + 50 * lv : 800 + 100 * lv,
					const: is1H ? 200 + 20 * lv : 400 + 40 * lv,
					mp: 400,
					range: 'short',
					pierce: is1H ? lv * 5 : lv * 10
				};
			case 'auraBlade':
				return {
					mult: is1H ? 200 + 20 * lv : 400 + 40 * lv,
					const: is1H ? 100 + 10 * lv : 200 + 20 * lv,
					mp: 500,
					range: 'short',
					pierce: 0
				};
			case 'swordTempest':
				return {
					mult: is1H ? 400 + 20 * lv : 800 + 40 * lv,
					const: is1H ? 100 + 10 * lv : 200 + 20 * lv,
					mp: 600,
					range: 'short',
					pierce: 0
				};
			case 'lunarShaft':
				return {
					mult: is1H ? 500 + 50 * lv : 1000 + 100 * lv,
					const: 300,
					mp: 300,
					range: 'short',
					pierce: 0
				};
			case 'rampage':
				return {
					mult: is1H ? 300 + 30 * lv : 600 + 60 * lv,
					const: is1H ? 100 + 10 * lv : 200 + 20 * lv,
					mp: 500,
					range: 'short',
					pierce: 0
				};
			default:
				return null;
		}
	});

	$effect(() => {
		if (presetValues) {
			skillMult = presetValues.mult;
			skillConst = presetValues.const;
			skillMp = presetValues.mp;
			rangeType = presetValues.range;
			piercePct = presetValues.pierce;
		}
	});

	// ─── Derived: computed stats ─────────────────────────────────────────
	const stats = $derived.by(() => {
		try {
			if (equipSource === 'build') {
				// Use buildToCharacter — pulls everything from store (stats + equipment)
				const char = buildToCharacter(build);
				return computeStats(char);
			} else {
				// Manual mode — construct Character from raw stats + manual equip
				const st = build.stat;
				const personalType = st.personalType ?? 'crt';
				const personalValue = st.personalValue ?? 0;
				const char = new Character({
					level: st.level,
					rawStats: {
						str: st.str,
						int: st.int,
						vit: st.vit,
						agi: st.agi,
						dex: st.dex,
						crt: personalType === 'crt' ? personalValue : 0,
						tec: personalType === 'tec' ? personalValue : 0,
						luk: personalType === 'luk' ? personalValue : 0,
						mtl: personalType === 'mtl' ? personalValue : 0
					},
					equipBonuses: {
						atkPercent: manualAtkPct,
						atk: manualFlatAtk,
						weaponAtkPercent: manualWatkPct,
						weaponAtk: manualFlatWatk
					},
					weaponType: manualWeaponType,
					weapon: { itemBaseAtk: manualBaseAtk, refine: manualRefine },
					armor: { itemBaseDef: manualBaseDef, refine: manualArmorRef }
				});
				return computeStats(char);
			}
		} catch {
			return null;
		}
	});

	// ─── Skill params ────────────────────────────────────────────────────
	let skillMult = $state(400);
	let skillConst = $state(0);
	let skillMp = $state(0);
	let activeBuff = $state(0);
	let passiveBuff = $state(0);
	let proration = $state(100);
	let rangeDmgPct = $state(0);
	let rangeType = $state('none');
	let comboPct = $state(100);
	let dtePct = $state(0);
	let elementStat = $state(0);
	let zeroStanceLv = $state(0);
	let piercePct = $state(0);

	// ─── State: target ───────────────────────────────────────────────────
	let targetMode = $state('boss');
	let bossSearch = $state('');
	let selectedBoss = $state(null);
	let activeDiff = $state('normal');

	let manualEnemyLv = $state(100);
	let manualEnemyDef = $state(200);
	let manualFlee = $state(100);
	let manualPRes = $state(0);

	// ─── Derived: effective enemy ────────────────────────────────────────
	const diff = $derived(DIFFICULTIES.find((d) => d.id === activeDiff));

	const enemy = $derived.by(() => {
		if (targetMode === 'manual') {
			return {
				level: manualEnemyLv,
				def: manualEnemyDef,
				flee: manualFlee,
				resistPct: manualPRes,
				weaponResistPct: 0
			};
		}
		if (!selectedBoss) return null;
		const b = selectedBoss;
		const isBoss = b.type === 'boss';
		const mult = isBoss ? diff.statMult : 1;
		const lvOff = isBoss ? diff.lvOffset : 0;
		return {
			level: b.level + lvOff,
			def: Math.round(resolveFirst(b.stats.def) * mult),
			flee: Math.round((b.stats.flee ?? 0) * mult),
			resistPct: resolveFirst(b.stats.pRes),
			weaponResistPct: 0,
			element: b.element,
			_boss: b,
			_isBoss: isBoss
		};
	});

	// ─── Derived: damage ────────────────────────────────────────────────
	const dmg = $derived.by(() => {
		if (!stats || !enemy) return null;
		try {
			const skillCtx = {
				skillMultiplier: skillMult,
				skillConstant: skillConst,
				mpCost: skillMp,
				activeBuff,
				passiveBuff,
				proration,
				comboMultiplier: comboPct,
				dte: dtePct,
				elementStat,
				zeroStanceLv,
				piercePercent: piercePct, // Fixed: was piercePct (wrong key)
				rangeDamage: rangeType !== 'none' ? rangeDmgPct : undefined,
				rangeType: rangeType !== 'none' ? rangeType : undefined
			};

			return calcDamage(stats, enemy, skillCtx, level);
		} catch (e) {
			console.error(e);
			return null;
		}
	});

	// breakdown steps for display
	const breakdown = $derived.by(() => {
		if (!stats || !enemy || !dmg) return null;
		const bd = dmg.breakdown;

		return {
			atkFloat: stats.atkFloat,
			playerLv: level,
			enemyLv: enemy.level,
			pRes: enemy.resistPct ?? 0,
			wRes: enemy.weaponResistPct ?? 0,
			bDmg: bd.bDmg,
			effDef: enemy.def,
			piercePct: bd.piercePercent,
			realEffDef: bd.effDef,
			effAtk: bd.effAtk,
			skillMult,
			skillConst,
			activeBuff,
			proration,
			passiveBuff,
			dtePct,
			elementStat,
			dteElement: bd.dteElement,
			zeroStanceLv: bd.zeroStanceLv,
			rangeDmg: bd.rangeDmg,
			comboPct,
			critDmg: stats.criticalDamage,
			maxDmg: dmg.maxDmg,
			stability: stats.stability,
			grazeMin: dmg.graze.min,
			grazeAvg: dmg.graze.avg,
			accuracy: stats.accuracy,
			flee: enemy.flee,
			hitRate: dmg.hitRate
		};
	});

	// ─── UI state ────────────────────────────────────────────────────────
	let showSkillDetails = $state(true);
	let showBreakdown = $state(true);

	const filteredBosses = $derived(
		bossesRaw.filter((b) => {
			if (!bossSearch) return true;
			const q = bossSearch.toLowerCase();
			return (
				b.name.toLowerCase().includes(q) ||
				(b.element ?? '').toLowerCase().includes(q) ||
				(b.location ?? '').toLowerCase().includes(q)
			);
		})
	);

	function fmt(v, unit = '') {
		if (v === null || v === undefined) return '—';
		return Number(v).toLocaleString() + unit;
	}
	function fmtF(v, dp = 2) {
		if (v === null || v === undefined) return '—';
		return Number(v).toFixed(dp);
	}

	const ELEMENT_COLOR = {
		Fire: '#e67e22',
		Water: 'var(--blue)',
		Wind: 'var(--teal)',
		Earth: '#a08060',
		Light: 'var(--gold)',
		Dark: 'var(--purple)',
		Neutral: 'var(--text-dim)'
	};
	const ELEMENT_EMOJI = {
		Fire: '🔥',
		Water: '💧',
		Wind: '🌪️',
		Earth: '🪨',
		Light: '✨',
		Dark: '🌑',
		Neutral: '⚪'
	};

	const WEAPON_LABELS = Object.fromEntries(
		Object.entries(WEAPON_CONTRIBUTIONS).map(([k, v]) => [k, v.label])
	);
</script>

<svelte:head><title>Damage Calculator — Toram Lab</title></svelte:head>

<div class="page">
	<div class="page-header">
		<div class="page-title-row">
			<Swords size={22} class="title-icon" />
			<div>
				<h1 class="page-title">DAMAGE CALCULATOR</h1>
				<p class="page-subtitle">
					Simulate damage against any boss or mini boss using the full formula chain
				</p>
			</div>
		</div>
	</div>

	<div class="calc-layout">
		<!-- LEFT COLUMN: Character + Skill -->
		<div class="left-col">
			<!-- Character Stats Panel -->
			<div class="panel">
				<div class="panel-header no-btn">
					<span class="panel-title"><Swords size={14} /> OFFENSIVE STATS</span>
					<div class="mode-tabs">
						<button
							class="mode-tab {equipSource === 'build' ? 'active' : ''}"
							onclick={() => (equipSource = 'build')}
						>
							<Link size={11} /> Build
						</button>
						<button
							class="mode-tab {equipSource === 'manual' ? 'active' : ''}"
							onclick={() => (equipSource = 'manual')}
						>
							<Settings size={11} /> Manual
						</button>
					</div>
				</div>

				<div class="panel-body">
					{#if equipSource === 'build'}
						<div class="build-sync-hint">
							<Link size={11} />
							<span class="bsh-text"
								>Synced from <a href="/character-builder">Character Builder</a></span
							>
						</div>
						{#if hasEquippedWeapon}
							<div class="equip-info">
								<span class="equip-label">Weapon</span>
								<span class="equip-value">{equippedWeaponItem.name} ({equippedWeaponType})</span>
							</div>
						{:else}
							<div class="equip-warn">
								<Info size={11} /> No weapon equipped — equip one in Character Builder or switch to Manual
								mode
							</div>
						{/if}
					{:else}
						<!-- Manual equipment inputs -->
						<div class="field-col">
							<label class="field-label">Weapon Type</label>
							<select class="field-select" bind:value={manualWeaponType}>
								{#each WEAPON_TYPES as wt (wt)}
									<option value={wt}>{WEAPON_LABELS[wt]}</option>
								{/each}
							</select>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Base ATK</label><input
									class="field-input"
									type="number"
									bind:value={manualBaseAtk}
									min="0"
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Refine</label><input
									class="field-input"
									type="number"
									bind:value={manualRefine}
									min="0"
									max="15"
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Base DEF</label><input
									class="field-input"
									type="number"
									bind:value={manualBaseDef}
									min="0"
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Armor Ref</label><input
									class="field-input"
									type="number"
									bind:value={manualArmorRef}
									min="0"
									max="15"
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">ATK%</label><input
									class="field-input"
									type="number"
									bind:value={manualAtkPct}
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Flat ATK</label><input
									class="field-input"
									type="number"
									bind:value={manualFlatAtk}
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">WATK%</label><input
									class="field-input"
									type="number"
									bind:value={manualWatkPct}
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Flat WATK</label><input
									class="field-input"
									type="number"
									bind:value={manualFlatWatk}
								/>
							</div>
						</div>
					{/if}

					{#if stats}
						<div class="divider"></div>
						<div class="all-stats-grid">
							{#each [['ATK', stats.atk], ['MATK', stats.matk], ['WATK', Math.floor(stats.weaponAtk)], ['Accuracy', stats.accuracy], ['Crit Rate', fmt(stats.criticalRate, '%')], ['Crit Dmg', fmt(stats.criticalDamage, '%')], ['Stability', fmt(stats.stability, '%')], ['DEF', stats.def], ['MDEF', stats.mdef]] as [k, v] (k)}
								<div class="as-row">
									<span class="as-k">{k}</span>
									<span class="as-v">{typeof v === 'number' ? fmt(v) : (v ?? '—')}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Skill Panel -->
			<div class="panel">
				<button class="panel-header" onclick={() => (showSkillDetails = !showSkillDetails)}>
					<span class="panel-title"><Zap size={14} /> SKILL / BUFFS</span>
					<span class="chevron {showSkillDetails ? 'open' : ''}">▾</span>
				</button>

				{#if showSkillDetails}
					<div class="panel-body">
						<div class="field-col">
							<label class="field-label">Skill Preset</label>
							<select class="field-select" bind:value={selectedSkillPreset}>
								<option value="custom">Custom (Manual Input)</option>
								<optgroup label="Blade Skills">
									<option value="hardHit">Hard Hit</option>
									<option value="astute">Astute</option>
									<option value="triggerSlash">Trigger Slash</option>
									<option value="meteorBreaker">Meteor Breaker</option>
									<option value="busterBlade">Buster Blade</option>
									<option value="shutOut">Shut Out</option>
									<option value="gladioVain">Gladio Vain</option>
									<option value="auraBlade">Aura Blade</option>
									<option value="swordTempest">Sword Tempest</option>
									<option value="lunarShaft">Lunar Shaft</option>
									<option value="rampage">Rampage (Finisher)</option>
								</optgroup>
							</select>
						</div>

						{#if selectedSkillPreset !== 'custom'}
							<div class="input-row2">
								<div class="field-col">
									<label class="field-label">Skill Level</label>
									<input
										class="field-input"
										type="number"
										bind:value={skillPresetLevel}
										min="1"
										max="10"
									/>
								</div>
								{#if selectedSkillPreset === 'shutOut'}
									<div class="field-col">
										<label class="field-label">Target Ailment</label>
										<select class="field-select" bind:value={shutOutAilment}>
											<option value="none">No status ailment</option>
											<option value="active">Active status ailment</option>
										</select>
									</div>
								{/if}
							</div>
						{/if}

						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Skill Mult%</label><input
									class="field-input"
									type="number"
									bind:value={skillMult}
									min="0"
									disabled={selectedSkillPreset !== 'custom'}
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Skill Const</label><input
									class="field-input"
									type="number"
									bind:value={skillConst}
									disabled={selectedSkillPreset !== 'custom'}
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">MP Cost</label><input
									class="field-input"
									type="number"
									bind:value={skillMp}
									min="0"
									disabled={selectedSkillPreset !== 'custom'}
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Proration%</label><input
									class="field-input"
									type="number"
									bind:value={proration}
									min="0"
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Active Buff%</label><input
									class="field-input"
									type="number"
									bind:value={activeBuff}
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Passive Buff%</label><input
									class="field-input"
									type="number"
									bind:value={passiveBuff}
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">DTE%</label><input
									class="field-input"
									type="number"
									bind:value={dtePct}
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Element Stat</label><input
									class="field-input"
									type="number"
									bind:value={elementStat}
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Combo Mult%</label><input
									class="field-input"
									type="number"
									bind:value={comboPct}
									min="0"
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Zero Stance Lv</label><input
									class="field-input"
									type="number"
									bind:value={zeroStanceLv}
									min="0"
									max="10"
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Pierce%</label><input
									class="field-input"
									type="number"
									bind:value={piercePct}
									min="0"
									max="100"
									disabled={selectedSkillPreset !== 'custom'}
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Range</label>
								<select class="field-select" bind:value={rangeType} disabled={selectedSkillPreset !== 'custom'}>
									<option value="none">None</option>
									<option value="short">Short Range</option>
									<option value="long">Long Range</option>
								</select>
							</div>
						</div>
						{#if rangeType !== 'none'}
							<div class="field-col">
								<label class="field-label">Range Dmg%</label>
								<input class="field-input" type="number" bind:value={rangeDmgPct} />
							</div>
						{/if}

						<div class="proration-hint">
							<Info size={11} />
							250 = physical starter · 100 = normal · values from skill sheet
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- CENTER COLUMN: Target -->
		<div class="center-col">
			<div class="panel">
				<div class="panel-header no-btn">
					<span class="panel-title"><Target size={14} /> TARGET</span>
					<div class="mode-tabs">
						<button
							class="mode-tab {targetMode === 'boss' ? 'active' : ''}"
							onclick={() => (targetMode = 'boss')}
						>
							<Skull size={11} /> Boss List
						</button>
						<button
							class="mode-tab {targetMode === 'manual' ? 'active' : ''}"
							onclick={() => (targetMode = 'manual')}
						>
							Manual
						</button>
					</div>
				</div>

				<div class="panel-body">
					{#if targetMode === 'boss'}
						<div class="boss-search-wrap">
							<input
								class="boss-search"
								type="search"
								placeholder="Filter by name, element, location…"
								bind:value={bossSearch}
							/>
						</div>

						<div class="diff-row">
							<span class="diff-lbl">Difficulty</span>
							<div class="diff-tabs">
								{#each DIFFICULTIES as d (d.id)}
									<button
										class="diff-tab {activeDiff === d.id ? 'active' : ''}"
										style="--dc:{DIFF_COLORS[d.id]}"
										onclick={() => (activeDiff = d.id)}>{d.label}</button
									>
								{/each}
							</div>
						</div>

						<div class="boss-list">
							{#each filteredBosses as b (b.name)}
								{@const isBoss = b.type === 'boss'}
								{@const selected = selectedBoss?.name === b.name}
								<button
									class="boss-row {selected ? 'selected' : ''} {isBoss ? 'is-boss' : 'is-mini'}"
									onclick={() => (selectedBoss = b)}
								>
									<span class="brow-badge {isBoss ? 'badge-boss' : 'badge-mini'}"
										>{isBoss ? 'B' : 'M'}</span
									>
									<span class="brow-name">{b.name}</span>
									<span class="brow-lv">Lv {b.level}</span>
									{#if b.element}
										<span
											class="brow-elem"
											style="color:{ELEMENT_COLOR[b.element] ?? 'var(--text-dim)'}"
										>
											{ELEMENT_EMOJI[b.element] ?? ''}
											{b.element}
										</span>
									{/if}
								</button>
							{/each}
						</div>

						{#if selectedBoss}
							{@const b = selectedBoss}
							{@const isBoss = b.type === 'boss'}
							{@const mult = isBoss ? diff.statMult : 1}
							{@const lvOff = isBoss ? diff.lvOffset : 0}
							<div class="selected-boss-info">
								<div class="sbi-header">
									<span class="sbi-name">{b.name}</span>
									{#if isBoss}
										<span class="sbi-diff" style="color:{DIFF_COLORS[activeDiff]}"
											>{DIFFICULTIES.find((d) => d.id === activeDiff)?.label}</span
										>
									{/if}
								</div>
								<div class="sbi-stats">
									<div class="sbi-s">
										<span class="sbi-k">Lv</span><span class="sbi-v">{b.level + lvOff}</span>
									</div>
									<div class="sbi-s">
										<span class="sbi-k">DEF</span><span class="sbi-v"
											>{Math.round(resolveFirst(b.stats.def) * mult)}</span
										>
									</div>
									<div class="sbi-s">
										<span class="sbi-k">MDEF</span><span class="sbi-v"
											>{Math.round(resolveFirst(b.stats.mDef) * mult)}</span
										>
									</div>
									<div class="sbi-s">
										<span class="sbi-k">P.RES</span><span class="sbi-v"
											>{resolveFirst(b.stats.pRes)}%</span
										>
									</div>
									<div class="sbi-s">
										<span class="sbi-k">FLEE</span><span class="sbi-v"
											>{Math.round((b.stats.flee ?? 0) * mult)}</span
										>
									</div>
									<div class="sbi-s">
										<span class="sbi-k">P.Prorat</span><span class="sbi-v">{b.stats.pProrat}</span>
									</div>
									<div class="sbi-s">
										<span class="sbi-k">N.Prorat</span><span class="sbi-v">{b.stats.nProrat}</span>
									</div>
								</div>
								{#if b.retaliates && b.retaliates !== 'N/A' && b.retaliates !== 'None'}
									<div class="sbi-ret"><Shield size={11} /> {b.retaliates}</div>
								{/if}
								{#if b.tips}
									<div class="sbi-tip"><Info size={11} /> {b.tips}</div>
								{/if}
							</div>
						{/if}
					{:else}
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Enemy Level</label><input
									class="field-input"
									type="number"
									bind:value={manualEnemyLv}
									min="0"
								/>
							</div>
							<div class="field-col">
								<label class="field-label">DEF</label><input
									class="field-input"
									type="number"
									bind:value={manualEnemyDef}
									min="0"
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">FLEE</label><input
									class="field-input"
									type="number"
									bind:value={manualFlee}
									min="0"
								/>
							</div>
							<div class="field-col">
								<label class="field-label">P.RES%</label><input
									class="field-input"
									type="number"
									bind:value={manualPRes}
									min="0"
									max="100"
								/>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- RIGHT COLUMN: Results -->
		<div class="right-col">
			<!-- Big result card -->
			{#if dmg && stats}
				<div class="result-hero">
					<div class="rh-row">
						<div class="rh-block">
							<span class="rh-label">MAX DAMAGE</span>
							<span class="rh-value dmg">{fmt(dmg.maxDmg)}</span>
						</div>
						<div class="rh-block">
							<span class="rh-label">AVERAGE</span>
							<span class="rh-value gold">{fmt(dmg.graze.avg)}</span>
						</div>
					</div>
					<div class="rh-row">
						<div class="rh-block">
							<span class="rh-label">GRAZE MIN</span>
							<span class="rh-value">{fmt(dmg.graze.min)}</span>
						</div>
						<div class="rh-block">
							<span class="rh-label">HIT RATE</span>
							<span class="rh-value {dmg.hitRate < 80 ? 'warn' : ''}">{fmt(dmg.hitRate)}%</span>
						</div>
					</div>
					<div class="rh-stab-bar">
						<span class="rh-stab-label">Stability {stats.stability}%</span>
						<div class="stab-track">
							<div class="stab-fill" style="width:{stats.stability}%" />
						</div>
					</div>
				</div>

				<!-- Breakdown -->
				<div class="panel">
					<button class="panel-header" onclick={() => (showBreakdown = !showBreakdown)}>
						<span class="panel-title"><Info size={14} /> FORMULA BREAKDOWN</span>
						<span class="chevron {showBreakdown ? 'open' : ''}">▾</span>
					</button>

					{#if showBreakdown && breakdown}
						<div class="panel-body breakdown">
							<div class="step">
								<div class="step-header">
									<span class="step-num">1</span>
									<span class="step-title">Base Damage</span>
									<span class="step-result">{fmt(breakdown.bDmg)}</span>
								</div>
								<div class="step-formula">
									<code
										>floor((ATK_float + playerLv − enemyLv) × (1 − P.RES%) × (1 − WeaponRES%))</code
									>
								</div>
								<div class="step-values">
									<div class="sv-row">
										<span class="sv-k">ATK (float)</span><span class="sv-v"
											>{fmtF(breakdown.atkFloat)}</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">Player Lv</span><span class="sv-v">{breakdown.playerLv}</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">Enemy Lv</span><span class="sv-v">{breakdown.enemyLv}</span>
									</div>
									<div class="sv-row">
										<span class="sv-k">P.RES</span><span class="sv-v">{breakdown.pRes}%</span>
									</div>
									<div class="sv-row">
										<span class="sv-k">Weapon RES</span><span class="sv-v">{breakdown.wRes}%</span>
									</div>
								</div>
							</div>

							<div class="step">
								<div class="step-header">
									<span class="step-num">2</span>
									<span class="step-title">Effective DEF</span>
									<span class="step-result">{fmt(breakdown.realEffDef)}</span>
								</div>
								<div class="step-formula">
									<code>floor(enemyDEF × (1 − pierce% / 100))</code>
								</div>
								<div class="step-values">
									<div class="sv-row">
										<span class="sv-k">Enemy DEF</span><span class="sv-v">{breakdown.effDef}</span>
									</div>
									<div class="sv-row">
										<span class="sv-k">Pierce</span><span class="sv-v">{breakdown.piercePct}%</span>
									</div>
								</div>
							</div>

							<div class="step">
								<div class="step-header">
									<span class="step-num">3</span>
									<span class="step-title">Effective ATK</span>
									<span class="step-result">{fmt(breakdown.effAtk)}</span>
								</div>
								<div class="step-formula">
									<code>max(0, BaseDmg − EffDEF)</code>
								</div>
								<div class="step-values">
									<div class="sv-row">
										<span class="sv-k">Base Dmg</span><span class="sv-v">{fmt(breakdown.bDmg)}</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">Eff DEF</span><span class="sv-v"
											>− {fmt(breakdown.realEffDef)}</span
										>
									</div>
								</div>
							</div>

							<div class="step">
								<div class="step-header">
									<span class="step-num">4</span>
									<span class="step-title">Damage Chain</span>
									<span class="step-result dmg">{fmt(breakdown.maxDmg)}</span>
								</div>
								<div class="step-formula">
									<code
										>floor((EffATK + Const) × Mult% × (1+ABuff%) × Prorat% × (1+PBuff%) ×
										(1+DTE+Elem%) × (1+ZeroStance%) × (1+Range%) × Combo% × CritDmg%)</code
									>
								</div>
								<div class="step-values">
									<div class="sv-row">
										<span class="sv-k">Eff ATK</span><span class="sv-v"
											>{fmt(breakdown.effAtk)}</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">Skill Const</span><span class="sv-v"
											>+{breakdown.skillConst}</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">× Skill Mult</span><span class="sv-v"
											>{breakdown.skillMult}%</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">× Active Buff</span><span class="sv-v"
											>+{breakdown.activeBuff}%</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">× Proration</span><span class="sv-v"
											>{breakdown.proration}%</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">× Passive Buff</span><span class="sv-v"
											>+{breakdown.passiveBuff}%</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">× DTE + Elem</span><span class="sv-v"
											>+{breakdown.dteElement}%
											<span class="sv-detail"
												>(DTE {breakdown.dtePct} + Elem {breakdown.elementStat})</span
											></span
										>
									</div>
									{#if breakdown.zeroStanceLv > 0}
										<div class="sv-row">
											<span class="sv-k">× Zero Stance</span><span class="sv-v"
												>+{breakdown.zeroStanceLv}%</span
											>
										</div>
									{/if}
									{#if breakdown.rangeDmg > 0}
										<div class="sv-row">
											<span class="sv-k">× Range Dmg</span><span class="sv-v"
												>+{breakdown.rangeDmg}%</span
											>
										</div>
									{/if}
									<div class="sv-row">
										<span class="sv-k">× Combo Mult</span><span class="sv-v"
											>{breakdown.comboPct}%</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">× Crit Dmg</span><span class="sv-v"
											>{breakdown.critDmg}%</span
										>
									</div>
									<div class="sv-row total">
										<span class="sv-k">= Max Dmg</span><span class="sv-v dmg"
											>{fmt(breakdown.maxDmg)}</span
										>
									</div>
								</div>
							</div>

							<div class="step">
								<div class="step-header">
									<span class="step-num">5</span>
									<span class="step-title">Graze Range</span>
									<span class="step-result"
										>{fmt(breakdown.grazeMin)} – {fmt(breakdown.maxDmg)}</span
									>
								</div>
								<div class="step-formula">
									<code>min = floor(0.5 × (stability/100) × maxDmg)</code>
								</div>
								<div class="step-values">
									<div class="sv-row">
										<span class="sv-k">Stability</span><span class="sv-v"
											>{breakdown.stability}%</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">Min</span><span class="sv-v">{fmt(breakdown.grazeMin)}</span>
									</div>
									<div class="sv-row">
										<span class="sv-k">Avg</span><span class="sv-v gold"
											>{fmt(breakdown.grazeAvg)}</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">Max</span><span class="sv-v dmg"
											>{fmt(breakdown.maxDmg)}</span
										>
									</div>
								</div>
							</div>

							<div class="step">
								<div class="step-header">
									<span class="step-num">6</span>
									<span class="step-title">Hit Rate</span>
									<span class="step-result {breakdown.hitRate < 80 ? 'warn' : ''}"
										>{fmt(breakdown.hitRate)}%</span
									>
								</div>
								<div class="step-formula">
									<code>min(100, max(0, floor(100 − (FLEE − ACC) / 3 + MP / 10)))</code>
								</div>
								<div class="step-values">
									<div class="sv-row">
										<span class="sv-k">Player ACC</span><span class="sv-v"
											>{fmt(breakdown.accuracy)}</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">Enemy FLEE</span><span class="sv-v"
											>{fmt(breakdown.flee)}</span
										>
									</div>
									<div class="sv-row">
										<span class="sv-k">MP Cost</span><span class="sv-v">{skillMp}</span>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="empty-result">
					<Swords size={40} style="opacity:0.15" />
					<p>
						{!enemy
							? 'Select a target to begin simulation'
							: 'Configure your character to see results'}
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 4rem;
	}

	/* Header */
	.page-header {
		margin-bottom: 1.5rem;
	}
	.page-title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.85rem;
	}
	.page-title-row :global(.title-icon) {
		color: var(--teal);
		margin-top: 4px;
		flex-shrink: 0;
		filter: drop-shadow(0 0 6px rgba(76, 201, 160, 0.4));
	}
	.page-title {
		font-family: var(--pixel);
		font-size: clamp(0.65rem, 2.5vw, 0.95rem);
		color: var(--teal);
		letter-spacing: 0.06em;
	}
	.page-subtitle {
		font-size: 0.78rem;
		color: var(--text-dim);
		margin-top: 0.3rem;
	}

	/* Layout */
	.calc-layout {
		display: grid;
		grid-template-columns: 300px 300px 1fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 1100px) {
		.calc-layout {
			grid-template-columns: 1fr 1fr;
		}
		.right-col {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 680px) {
		.calc-layout {
			grid-template-columns: 1fr;
		}
	}

	.left-col,
	.center-col,
	.right-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Panels */
	.panel {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 10px;
		overflow: hidden;
	}
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.8rem 1.1rem;
		width: 100%;
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		border-bottom: 1px solid var(--border);
	}
	.panel-header.no-btn {
		cursor: default;
	}
	.panel-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--pixel);
		font-size: 0.5rem;
		color: var(--gold);
		letter-spacing: 0.08em;
	}
	.panel-title :global(svg) {
		color: var(--gold);
	}
	.chevron {
		color: var(--text-dim);
		transition: transform 0.2s;
		font-size: 0.9rem;
	}
	.chevron.open {
		transform: rotate(180deg);
	}
	.panel-body {
		padding: 1rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	/* Fields */
	.field-label {
		font-size: 0.68rem;
		color: var(--text-dim);
		white-space: nowrap;
		flex-shrink: 0;
		min-width: 64px;
	}
	.field-input,
	.field-select {
		flex: 1;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 5px;
		color: var(--text-bright);
		font-size: 0.78rem;
		padding: 0.3rem 0.5rem;
		outline: none;
		width: 100%;
	}
	.field-input:focus,
	.field-select:focus {
		border-color: rgba(74, 158, 255, 0.45);
	}
	.input-row2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.field-col {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	/* Build sync hint */
	.build-sync-hint {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.65rem;
		color: var(--text-dim);
		padding: 0.35rem 0.55rem;
		background: rgba(76, 201, 160, 0.04);
		border: 1px solid rgba(76, 201, 160, 0.15);
		border-radius: 5px;
	}
	.build-sync-hint :global(svg) {
		flex-shrink: 0;
		color: var(--teal);
	}
	.build-sync-hint a {
		color: var(--teal);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Equip info */
	.equip-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	.equip-label {
		font-family: var(--pixel);
		font-size: 0.35rem;
		color: var(--text-dim);
		letter-spacing: 0.05em;
	}
	.equip-value {
		font-size: 0.72rem;
		color: var(--text-bright);
		font-weight: 600;
	}
	.equip-warn {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.62rem;
		color: #e07b39;
		padding: 0.35rem 0.55rem;
		background: rgba(224, 123, 57, 0.06);
		border: 1px solid rgba(224, 123, 57, 0.18);
		border-radius: 5px;
	}
	.equip-warn :global(svg) {
		flex-shrink: 0;
	}

	.divider {
		height: 1px;
		background: var(--border);
		margin: 0.2rem 0;
	}

	/* Proration hint */
	.proration-hint {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.62rem;
		color: var(--text-dim);
		padding: 0.4rem 0.55rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 5px;
	}
	.proration-hint :global(svg) {
		flex-shrink: 0;
		color: var(--gold);
	}

	/* Mode tabs */
	.mode-tabs {
		display: flex;
		gap: 0.28rem;
	}
	.mode-tab {
		display: flex;
		align-items: center;
		gap: 0.28rem;
		padding: 0.25rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.02);
		color: var(--text-dim);
		font-size: 0.68rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.mode-tab:hover {
		border-color: var(--border-glow);
		color: var(--text-bright);
	}
	.mode-tab.active {
		border-color: rgba(76, 201, 160, 0.35);
		background: rgba(76, 201, 160, 0.07);
		color: var(--teal);
	}
	.mode-tab :global(svg) {
		flex-shrink: 0;
	}

	/* Boss picker */
	.boss-search-wrap {
		position: relative;
	}
	.boss-search {
		width: 100%;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--border);
		border-radius: 5px;
		color: var(--text-bright);
		font-size: 0.75rem;
		padding: 0.35rem 0.6rem;
		outline: none;
	}
	.boss-search:focus {
		border-color: rgba(74, 158, 255, 0.35);
	}

	.diff-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.diff-lbl {
		font-family: var(--pixel);
		font-size: 0.38rem;
		color: var(--text-dim);
		letter-spacing: 0.05em;
		white-space: nowrap;
	}
	.diff-tabs {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.diff-tab {
		padding: 0.22rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.02);
		color: var(--text-dim);
		font-size: 0.67rem;
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

	.boss-list {
		max-height: 320px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
	}
	.boss-list::-webkit-scrollbar {
		width: 4px;
	}
	.boss-list::-webkit-scrollbar-thumb {
		background: var(--border);
		border-radius: 4px;
	}
	.boss-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.55rem;
		border: 1px solid transparent;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.02);
		cursor: pointer;
		text-align: left;
		transition: all 0.13s;
	}
	.boss-row:hover {
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--border);
	}
	.boss-row.selected {
		background: rgba(230, 57, 70, 0.06);
		border-color: rgba(230, 57, 70, 0.25);
	}
	.boss-row.is-mini.selected {
		background: rgba(76, 201, 160, 0.06);
		border-color: rgba(76, 201, 160, 0.28);
	}
	.brow-badge {
		font-family: var(--pixel);
		font-size: 0.33rem;
		padding: 1px 5px;
		border-radius: 3px;
		flex-shrink: 0;
	}
	.badge-boss {
		background: rgba(230, 57, 70, 0.1);
		border: 1px solid rgba(230, 57, 70, 0.2);
		color: var(--crimson);
	}
	.badge-mini {
		background: rgba(76, 201, 160, 0.1);
		border: 1px solid rgba(76, 201, 160, 0.22);
		color: var(--teal);
	}
	.brow-name {
		font-size: 0.73rem;
		color: var(--text-bright);
		flex: 1;
	}
	.brow-lv {
		font-size: 0.63rem;
		color: var(--text-dim);
		white-space: nowrap;
	}
	.brow-elem {
		font-size: 0.62rem;
		white-space: nowrap;
	}

	/* Selected boss info */
	.selected-boss-info {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 0.65rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.sbi-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.sbi-name {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-bright);
	}
	.sbi-diff {
		font-family: var(--pixel);
		font-size: 0.38rem;
		letter-spacing: 0.05em;
	}
	.sbi-stats {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.sbi-s {
		display: flex;
		flex-direction: column;
		gap: 0.08rem;
		padding: 0.25rem 0.45rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	.sbi-k {
		font-family: var(--pixel);
		font-size: 0.33rem;
		color: var(--text-dim);
	}
	.sbi-v {
		font-size: 0.73rem;
		font-weight: 700;
		color: var(--text-bright);
	}
	.sbi-ret {
		display: flex;
		align-items: flex-start;
		gap: 0.35rem;
		font-size: 0.68rem;
		color: var(--text-dim);
		line-height: 1.45;
		padding: 0.4rem 0.55rem;
		background: rgba(230, 57, 70, 0.04);
		border: 1px solid rgba(230, 57, 70, 0.15);
		border-radius: 5px;
	}
	.sbi-ret :global(svg) {
		flex-shrink: 0;
		color: var(--crimson);
		margin-top: 1px;
	}
	.sbi-tip {
		display: flex;
		align-items: flex-start;
		gap: 0.35rem;
		font-size: 0.68rem;
		color: var(--text-dim);
		line-height: 1.45;
		padding: 0.4rem 0.55rem;
		background: rgba(76, 201, 160, 0.04);
		border: 1px solid rgba(76, 201, 160, 0.13);
		border-radius: 5px;
	}
	.sbi-tip :global(svg) {
		flex-shrink: 0;
		color: var(--teal);
		margin-top: 1px;
	}

	/* Result hero */
	.result-hero {
		background: linear-gradient(160deg, var(--bg-card), var(--bg-panel));
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 1rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.rh-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.7rem;
	}
	.rh-block {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.rh-label {
		font-family: var(--pixel);
		font-size: 0.38rem;
		color: var(--text-dim);
		letter-spacing: 0.06em;
	}
	.rh-value {
		font-size: 1.45rem;
		font-weight: 800;
		color: var(--text-bright);
		font-variant-numeric: tabular-nums;
	}
	.rh-value.dmg {
		color: var(--crimson);
		filter: drop-shadow(0 0 8px rgba(230, 57, 70, 0.4));
	}
	.rh-value.gold {
		color: var(--gold);
	}
	.rh-value.warn {
		color: #e07b39;
	}
	.rh-stab-bar {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.rh-stab-label {
		font-size: 0.65rem;
		color: var(--text-dim);
	}
	.stab-track {
		height: 4px;
		background: rgba(255, 255, 255, 0.07);
		border-radius: 4px;
		overflow: hidden;
	}
	.stab-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--teal), var(--gold));
		border-radius: 4px;
		transition: width 0.3s;
	}

	/* Breakdown steps */
	.breakdown {
		gap: 0;
		padding: 0;
	}
	.step {
		border-bottom: 1px solid var(--border);
		padding: 0.7rem 0.9rem;
	}
	.step:last-child {
		border-bottom: none;
	}
	.step-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.35rem;
	}
	.step-num {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: rgba(76, 201, 160, 0.15);
		border: 1px solid rgba(76, 201, 160, 0.3);
		color: var(--teal);
		font-size: 0.65rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.step-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-bright);
		flex: 1;
	}
	.step-result {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--gold);
		font-variant-numeric: tabular-nums;
	}
	.step-result.dmg {
		color: var(--crimson);
	}
	.step-result.warn {
		color: #e07b39;
	}
	.step-formula {
		font-size: 0.58rem;
		color: var(--text-dim);
		margin-bottom: 0.5rem;
		padding: 0.3rem 0.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 4px;
		line-height: 1.5;
		overflow-x: auto;
	}
	.step-formula code {
		font-family: 'Courier New', monospace;
	}
	.step-values {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.18rem 0.5rem;
	}
	.sv-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.18rem 0.35rem;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.015);
	}
	.sv-row.total {
		background: rgba(230, 57, 70, 0.06);
		border: 1px solid rgba(230, 57, 70, 0.15);
		grid-column: 1 / -1;
	}
	.sv-k {
		font-size: 0.62rem;
		color: var(--text-dim);
	}
	.sv-v {
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--text-bright);
		font-variant-numeric: tabular-nums;
	}
	.sv-v.dmg {
		color: var(--crimson);
	}
	.sv-v.gold {
		color: var(--gold);
	}
	.sv-detail {
		font-size: 0.55rem;
		color: var(--text-dim);
		font-weight: 400;
	}

	/* All stats grid */
	.all-stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 0.22rem;
	}
	.as-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0.45rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 4px;
	}
	.as-k {
		font-size: 0.63rem;
		color: var(--text-dim);
	}
	.as-v {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-bright);
		font-variant-numeric: tabular-nums;
	}

	.empty-result {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 4rem 2rem;
		color: var(--text-dim);
		font-size: 0.8rem;
		text-align: center;
	}
	.empty-result :global(svg) {
		color: var(--text-dim);
	}
</style>
