<script>
	import { Swords, Target, Info, Skull, Zap, Shield, Link, Settings } from '@lucide/svelte';
	import { computeStats, computeCharacterStats } from '$lib/application/character-stat.js';
	import { calcDamage, calcDamageMultiHit } from '$lib/application/damage-calculator.js';
	import { WEAPON_CONTRIBUTIONS, WEAPON_TYPES } from '$lib/domain/constants/weapon-types.js';
	import { Character } from '$lib/domain/character.js';
	import bossesRaw from '$lib/data/bosses.json';
	import { activeBuild } from '$lib/stores/buildStore.js';
	import { skills, getSkill, getModifierDefaults, resolveSkillHits } from '$lib/data/skills.js';
	import { itemTypes } from '$lib/constant/item-types.js';

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

	// Build reverse lookup: item type label → camelCase key
	const labelToWeaponKey = $derived(
		Object.fromEntries(
			Object.entries(itemTypes).map(([key, label]) => [label, key])
		)
	);

	// Detect weapon from equipped item
	const equippedWeaponItem = $derived(build.equipment?.weapon?.item);
	const equippedWeaponRawType = $derived(equippedWeaponItem?.type ?? null);
	const equippedWeaponType = $derived(
		equippedWeaponRawType ? (labelToWeaponKey[equippedWeaponRawType] ?? equippedWeaponRawType) : null
	);
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

	// ─── Blade Skill Presets (data-driven) ───────────────────────────────
	// Collect all blade skills
	const bladeSkills = $derived(skills.blade ?? []);

	// Selected skill: 'custom' means manual input, otherwise it's a skill ID
	let selectedSkillId = $state('custom');
	let skillPresetLevel = $state(10);

	// Current skill definition (null for custom)
	const selectedSkillDef = $derived(
		selectedSkillId !== 'custom' ? getSkill('blade', selectedSkillId) : null
	);

	// Modifier values for the selected skill
	// We store them in a reactive object keyed by skill ID to support switching
	let modifierValues = $state({});
	
	// Reset modifier values when skill changes
	$effect(() => {
		if (selectedSkillDef) {
			modifierValues = getModifierDefaults(selectedSkillDef);
		} else {
			modifierValues = {};
		}
	});

	// ─── Derived: computed stats ─────────────────────────────────────────
	const stats = $derived.by(() => {
		try {
			if (equipSource === 'build') {
				return computeCharacterStats(build);
			} else {
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

	// Base stats from the build (for formulas that need raw stats like OgreSlash, SwordTempest, etc.)
	const baseStats = $derived({
		str: build.stat.str ?? 0,
		int: build.stat.int ?? 0,
		vit: build.stat.vit ?? 0,
		agi: build.stat.agi ?? 0,
		dex: build.stat.dex ?? 0
	});

	// ─── Skill params (manual mode) ──────────────────────────────────────
	// These are used when selectedSkillId === 'custom'
	let customSkillMult = $state(400);
	let customSkillConst = $state(0);
	let customSkillMp = $state(0);
	let customPiercePct = $state(0);
	let customRangeType = $state('none');
	let customRangeDmgPct = $state(0);

	let activeBuff = $state(0);
	let passiveBuff = $state(0);
	let proration = $state(100);
	let comboPct = $state(100);
	let dtePct = $state(0);
	let elementStat = $state(0);
	let zeroStanceLv = $state(0);

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

	// ─── Resolve skill hits from definition ──────────────────────────────
	const resolvedHits = $derived.by(() => {
		if (!selectedSkillDef) return null;
		if (!stats) return null;

		return resolveSkillHits(selectedSkillDef, {
			level: skillPresetLevel,
			weaponType: activeWeaponType,
			stats,
			baseStats,
			modifierValues,
			resources: {}
		});
	});

	const isCustom = $derived(selectedSkillId === 'custom');
	const isMultiHit = $derived(resolvedHits && resolvedHits.length > 1);

	// ─── Derived: damage ────────────────────────────────────────────────
	// Global context shared across all hit computations
	const globalCtx = $derived({
		activeBuff,
		passiveBuff,
		proration,
		comboMultiplier: comboPct,
		dte: dtePct,
		elementStat,
		zeroStanceLv
	});

	const dmg = $derived.by(() => {
		if (!stats || !enemy) return null;
		try {
			if (isCustom) {
				// Manual mode: single hit with calcDamage
				const skillCtx = {
					skillMultiplier: customSkillMult,
					skillConstant: customSkillConst,
					mpCost: customSkillMp,
					activeBuff,
					passiveBuff,
					proration,
					comboMultiplier: comboPct,
					dte: dtePct,
					elementStat,
					zeroStanceLv,
					piercePercent: customPiercePct,
					rangeDamage: customRangeType !== 'none' ? customRangeDmgPct : undefined,
					rangeType: customRangeType !== 'none' ? customRangeType : undefined
				};

				return calcDamage(stats, enemy, skillCtx, level);
			} else if (resolvedHits && resolvedHits.length > 0) {
				if (resolvedHits.length === 1) {
					// Single hit skill: use calcDamage for backward compatibility
					const hit = resolvedHits[0];
					// Apply overflowMult if present
					let skillMult = hit.mult;
					if (hit.overflowMult) {
						skillMult = hit.mult * (1 + hit.overflowMult);
					}
					// Get range damage
					const rangeDmg =
						hit.rangeDamage != null
							? hit.rangeDamage
							: hit.rangeType === 'short'
								? (stats.shortRangeDamagePercent ?? 0)
								: hit.rangeType === 'long'
									? (stats.longRangeDamagePercent ?? 0)
									: 0;

					const skillCtx = {
						skillMultiplier: skillMult,
						skillConstant: hit.const ?? 0,
						mpCost: hit.mpCost ?? selectedSkillDef?.mpCost ?? 0,
						activeBuff,
						passiveBuff,
						proration,
						comboMultiplier: comboPct,
						dte: dtePct,
						elementStat,
						zeroStanceLv,
						piercePercent: hit.pierce ?? 0,
						rangeDamage: rangeDmg,
						rangeType: hit.rangeType ?? selectedSkillDef?.range
					};

					const result = calcDamage(stats, enemy, skillCtx, level);
					return {
						...result,
						hits: [
							{
								hitId: hit.id,
								label: hit.label,
								hitCount: hit.hitCount ?? 1,
								splitDamage: hit.splitDamage ?? false,
								maxDmg: result.maxDmg,
								graze: result.graze,
								hitRate: result.hitRate,
								breakdown: {
									...result.breakdown,
									skillMult,
									skillConst: hit.const ?? 0
								}
							}
						],
						totalMaxDmg: result.maxDmg,
						totalAvgDmg: result.graze.avg,
						totalMinDmg: result.graze.min
					};
				} else {
					// Multi-hit skill
					const multiResult = calcDamageMultiHit(stats, enemy, resolvedHits, globalCtx, level);
					const totalGrazeMin = multiResult.hits?.reduce((sum, h) => {
						return sum + (h.graze?.min ?? 0) * (h.hitCount ?? 1);
					}, 0) ?? 0;
					return {
						...multiResult,
						// Use a single-hit result for the base breakdown display
						maxDmg: multiResult.totalMaxDmg,
						graze: { min: totalGrazeMin, avg: multiResult.totalAvgDmg, max: multiResult.totalMaxDmg },
						hitRate: multiResult.hitRate
					};
				}
			}

			return null;
		} catch (e) {
			console.error(e);
			return null;
		}
	});

	// breakdown steps for display
	const breakdown = $derived.by(() => {
		if (!stats || !enemy || !dmg) return null;
		if (isCustom) {
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
				skillMult: customSkillMult,
				skillConst: customSkillConst,
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
				hitRate: dmg.hitRate,
				// Multi-hit info
				hits: dmg.hits
			};
		}
		
		// For skill preset mode: show first hit breakdown as primary, plus multi-hit info
		const firstHit = dmg.hits?.[0];
		const bd = firstHit?.breakdown ?? dmg.breakdown ?? {};
		return {
			atkFloat: stats.atkFloat,
			playerLv: level,
			enemyLv: enemy.level,
			pRes: enemy.resistPct ?? 0,
			wRes: enemy.weaponResistPct ?? 0,
			bDmg: bd.bDmg,
			effDef: enemy.def,
			piercePct: bd.piercePercent ?? 0,
			realEffDef: bd.effDef,
			effAtk: bd.effAtk,
			skillMult: bd.skillMult ?? 0,
			skillConst: bd.skillConst ?? 0,
			activeBuff,
			proration,
			passiveBuff,
			dtePct,
			elementStat,
			dteElement: bd.dteElement ?? 0,
			zeroStanceLv: bd.zeroStanceLv ?? 0,
			rangeDmg: bd.rangeDmg ?? 0,
			comboPct,
			critDmg: stats.criticalDamage,
			maxDmg: dmg.totalMaxDmg ?? dmg.maxDmg,
			stability: stats.stability,
		grazeMin: dmg.totalAvgDmg != null
			? (dmg.hits?.reduce((sum, h) => sum + (h.graze?.min ?? 0) * (h.hitCount ?? 1), 0) ?? 0)
			: (dmg.graze?.min ?? 0),
		grazeAvg: dmg.totalAvgDmg ?? dmg.graze?.avg ?? 0,
			accuracy: stats.accuracy,
			flee: enemy.flee,
			hitRate: dmg.hitRate,
			// Multi-hit info
			hits: dmg.hits,
			isMultiHit: dmg.hits && dmg.hits.length > 1
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

	// Group skills by tier for the selector
	const skillsByTier = $derived.by(() => {
		const groups = {};
		for (const s of bladeSkills) {
			const key = `T${s.tier}`;
			if (!groups[key]) groups[key] = [];
			groups[key].push(s);
		}
		return groups;
	});

	// Check if a skill is compatible with current weapon
	function isSkillCompatible(skill) {
		return skill.weaponTypes.includes(activeWeaponType);
	}

	// Update modifier value for the selected skill
	function updateModifier(modId, value) {
		modifierValues = { ...modifierValues, [modId]: value };
	}
</script>

<div class="calc-layout">
	<!-- LEFT COLUMN: Skill / Buffs -->
	<div class="left-col">
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
						<select class="field-select" bind:value={selectedSkillId}>
							<option value="custom">Custom (Manual Input)</option>
							{#each Object.entries(skillsByTier) as [tier, skillList] (tier)}
								<optgroup label="Blade Skills ({tier})">
									{#each skillList as skill (skill.id)}
										<option value={skill.id} disabled={!isSkillCompatible(skill)}>
											{skill.name} {!isSkillCompatible(skill) ? '(incompatible)' : ''}
										</option>
									{/each}
								</optgroup>
							{/each}
						</select>
					</div>

					{#if !isCustom && selectedSkillDef}
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Skill Level</label>
								<input
									class="field-input"
									type="number"
									bind:value={skillPresetLevel}
									min="1"
									max={selectedSkillDef.maxLevel}
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Tier {selectedSkillDef.tier}</label>
								<span class="field-display">MP: {selectedSkillDef.mpCost}</span>
							</div>
						</div>

						<!-- Dynamic Modifiers from skill definition -->
						{#if selectedSkillDef.modifiers}
							{#each selectedSkillDef.modifiers as mod (mod.id)}
								{#if mod.type === 'select'}
									<div class="field-col">
										<label class="field-label">{mod.label}</label>
										<select class="field-select" value={modifierValues[mod.id] ?? mod.defaultValue}
											onchange={(e) => updateModifier(mod.id, e.target.value)}>
											{#each mod.options ?? [] as opt (opt.value)}
												<option value={opt.value}>{opt.label}</option>
											{/each}
										</select>
									</div>
								{:else if mod.type === 'checkbox'}
									<div class="field-row-check">
										<label class="check-label">
											<input type="checkbox" checked={modifierValues[mod.id] ?? mod.defaultValue}
												onchange={(e) => updateModifier(mod.id, e.target.checked)} />
											{mod.label}
										</label>
										{#if mod.tooltip}
											<div class="mod-tooltip">
												<Info size={11} />
												<span class="tooltip-text">{mod.tooltip}</span>
											</div>
										{/if}
									</div>
								{:else if mod.type === 'range'}
									<div class="field-col">
										<label class="field-label">
											{mod.label}: {modifierValues[mod.id] ?? mod.defaultValue}
										</label>
										<input type="range" class="field-range"
											min={mod.min ?? 1} max={mod.max ?? 10}
											value={modifierValues[mod.id] ?? mod.defaultValue}
											oninput={(e) => updateModifier(mod.id, Number(e.target.value))} />
									</div>
								{:else if mod.type === 'number'}
									<div class="field-col">
										<label class="field-label">{mod.label}</label>
										<input class="field-input" type="number"
											min={mod.min} max={mod.max}
											value={modifierValues[mod.id] ?? mod.defaultValue}
											oninput={(e) => updateModifier(mod.id, Number(e.target.value))} />
									</div>
								{/if}
							{/each}
						{/if}

						<!-- Resource display -->
						{#if selectedSkillDef.resources}
							{#each selectedSkillDef.resources as res (res.id)}
								<div class="field-col">
									<label class="field-label">{res.label}</label>
									<span class="field-display">0 / {res.max}</span>
								</div>
							{/each}
						{/if}

						<!-- Multi-hit info -->
						{#if selectedSkillDef.hits && selectedSkillDef.hits.length > 1}
							<div class="mod-tooltip">
								<Info size={11} />
								<span class="tooltip-text">
									{selectedSkillDef.hits.length} stages ({selectedSkillDef.hits.map(h => h.label).join(', ')})
								</span>
							</div>
						{/if}

						<!-- Proration type -->
						{#if selectedSkillDef.prorationType === 'magic'}
							<div class="mod-tooltip">
								<Info size={11} />
								<span class="tooltip-text">Uses Magic Proration</span>
							</div>
						{/if}

						<!-- Incompatible weapon warning -->
						{#if !isSkillCompatible(selectedSkillDef)}
							<div class="equip-warn">
								<Info size={11} />
								Requires {selectedSkillDef.weaponTypes.map(w => WEAPON_LABELS[w] ?? w).join(' / ')}
							</div>
						{/if}
					{/if}

					<!-- Custom / Manual skill inputs (shown always, disabled when skill preset selected) -->
					<div class="input-row2">
						<div class="field-col">
							<label class="field-label">Skill Mult%</label><input
								class="field-input"
								type="number"
								bind:value={customSkillMult}
								min="0"
								disabled={!isCustom}
							/>
						</div>
						<div class="field-col">
							<label class="field-label">Skill Const</label><input
								class="field-input"
								type="number"
								bind:value={customSkillConst}
								disabled={!isCustom}
							/>
						</div>
					</div>

					{#if isCustom}
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">MP Cost</label><input
									class="field-input"
									type="number"
									bind:value={customSkillMp}
									min="0"
								/>
							</div>
							<div class="field-col">
								<label class="field-label">Pierce%</label><input
									class="field-input"
									type="number"
									bind:value={customPiercePct}
									min="0"
									max="100"
								/>
							</div>
						</div>
						<div class="input-row2">
							<div class="field-col">
								<label class="field-label">Range</label>
								<select class="field-select" bind:value={customRangeType}>
									<option value="none">None</option>
									<option value="short">Short Range</option>
									<option value="long">Long Range</option>
								</select>
							</div>
							{#if customRangeType !== 'none'}
								<div class="field-col">
									<label class="field-label">Range Dmg%</label>
									<input class="field-input" type="number" bind:value={customRangeDmgPct} />
								</div>
							{/if}
						</div>
					{/if}

					<div class="divider"></div>

					<!-- Global Buff parameters (shared across custom and preset modes) -->
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
							<label class="field-label">Proration%</label><input
								class="field-input"
								type="number"
								bind:value={proration}
								min="0"
							/>
						</div>
						<div class="field-col">
							<label class="field-label">Combo Mult%</label><input
								class="field-input"
								type="number"
								bind:value={comboPct}
								min="0"
							/>
						</div>
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
		{#if dmg && stats}
			<div class="result-hero">
				<div class="rh-row">
					<div class="rh-block">
						<span class="rh-label">MAX DAMAGE</span>
						<span class="rh-value dmg">{fmt(breakdown?.maxDmg ?? dmg.totalMaxDmg ?? dmg.maxDmg)}</span>
					</div>
					<div class="rh-block">
						<span class="rh-label">AVERAGE</span>
						<span class="rh-value gold">{fmt(breakdown?.grazeAvg ?? dmg.totalAvgDmg ?? dmg.graze?.avg)}</span>
					</div>
				</div>
				<div class="rh-row">
					<div class="rh-block">
						<span class="rh-label">GRAZE MIN</span>
						<span class="rh-value">{fmt(breakdown?.grazeMin ?? dmg.graze?.min)}</span>
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

			<!-- Multi-hit breakdown (shown when skill has multiple hits) -->
			{#if breakdown?.isMultiHit && breakdown?.hits}
				<div class="panel">
					<div class="panel-header no-btn">
						<span class="panel-title"><Info size={14} /> PER-HIT BREAKDOWN</span>
					</div>
					<div class="panel-body">
						<div class="step-values">
							{#each breakdown.hits as hit (hit.hitId)}
								<div class="sv-row multi-hit">
									<span class="sv-k">{hit.label}</span>
									<span class="sv-v dmg">
										{fmt(hit.maxDmg)}
										{#if (hit.hitCount ?? 1) > 1}
											<span class="sv-detail"> ×{hit.hitCount}</span>
										{/if}
									</span>
								</div>
							{/each}
							<div class="sv-row total">
								<span class="sv-k">= Total Max Dmg</span>
								<span class="sv-v dmg">{fmt(breakdown.maxDmg)}</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

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
								<code>floor((ATK_float + playerLv − enemyLv) × (1 − P.RES%) × (1 − WeaponRES%))</code>
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
									<span class="sv-k">Enemy DEF</span><span class="sv-v">{fmt(breakdown.effDef)}</span>
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
									<span class="sv-k">MP Cost</span><span class="sv-v"
										>{isCustom ? customSkillMp : (selectedSkillDef?.mpCost ?? 0)}</span
									>
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

<style>
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
	.field-input:disabled,
	.field-select:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.field-display {
		font-size: 0.78rem;
		color: var(--text-bright);
		padding: 0.3rem 0.5rem;
	}
	.field-range {
		width: 100%;
		accent-color: var(--gold);
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
	.field-row-check {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.check-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.73rem;
		color: var(--text-bright);
		cursor: pointer;
	}
	.check-label input[type="checkbox"] {
		accent-color: var(--teal);
		width: 14px;
		height: 14px;
	}
	.mod-tooltip {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.62rem;
		color: var(--text-dim);
		padding: 0.25rem 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid var(--border);
		border-radius: 4px;
	}
	.mod-tooltip :global(svg) {
		flex-shrink: 0;
		color: var(--gold);
	}
	.tooltip-text {
		font-size: 0.62rem;
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
	.step-num-icon {
		font-size: 0.7rem;
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
	.sv-row.multi-hit {
		border-left: 2px solid var(--gold);
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