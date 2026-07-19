/**
 * @file Application: Damage Calculator
 * Orchestrates computed stats → damage formula with enemy & skill context.
 */

import * as F from '../formula/index.js';

/**
 * @typedef {Object} EnemyContext
 * @property {number} level
 * @property {number} def
 * @property {number} flee
 * @property {number} [resistPct] physical/magic resistance %
 * @property {number} [weaponResistPct] weapon-type resistance %
 * @property {string} [element] enemy element
 * @property {number} [difficultyStatMult] from difficulty table
 * @property {number} [difficultyLvOffset] from difficulty table
 */

/**
 * @typedef {Object} SkillContext
 * @property {number} [skillConstant]
 * @property {number} skillMultiplier (100 = auto attack)
 * @property {number} [mpCost] for hit rate
 * @property {number} [proration] 250 for physical starter, 100 normal
 * @property {number} [activeBuff] additive %
 * @property {number} [passiveBuff] additive %
 * @property {number} [dte] damage to element % from equipment
 * @property {number} [elementStat] weapon element stat
 * @property {number} [zeroStanceLv]
 * @property {'short'|'long'} [rangeType]
 * @property {number} [comboMultiplier] 100 opener, 150 Smite
 */

/**
 * Compute full damage for a single hit against an enemy.
 * @param {Object} playerStats - output from computeStats()
 * @param {EnemyContext} enemy
 * @param {SkillContext} skill
 * @param {number} [playerLevel]
 * @returns {Object} { maxDmg, graze, hitRate, breakdown }
 */
export function calcDamage(playerStats, enemy, skill, playerLevel) {
	const level = playerLevel ?? 0;

	// --- Difficulty-adjusted enemy stats ---
	const effEnemyDef = enemy.def * (enemy.difficultyStatMult ?? 1);
	const effEnemyLv = enemy.level + (enemy.difficultyLvOffset ?? 0);
	const effEnemyFlee = enemy.flee * (enemy.difficultyStatMult ?? 1);

	// --- Step 1: Base Damage (uses unfloored ATK float) ---
	const bDmg = F.baseDamage(
		playerStats.atkFloat,
		level,
		effEnemyLv,
		enemy.resistPct ?? 0,
		enemy.weaponResistPct ?? 0
	);

	// --- Step 2: Effective DEF (use skill piercePercent, defaulting to 0) ---
	const effDef = F.effectiveDef(effEnemyDef, skill.piercePercent ?? 0);

	// --- Step 3: Effective ATK ---
	const effAtk = F.effectiveAtk(bDmg, effDef);

	// --- Range Damage ---
	const rangeDmg =
		skill.rangeDamage != null
			? skill.rangeDamage
			: skill.rangeType === 'short'
				? (playerStats.shortRangeDamagePercent ?? 0)
				: skill.rangeType === 'long'
					? (playerStats.longRangeDamagePercent ?? 0)
					: 0;

	// --- DTE + Element ---
	const dteElement = (skill.dte ?? 0) + (skill.elementStat ?? 0);

	// --- Step 4: Full chain (ONE floor at end) ---
	const maxDmg = F.maxDamage({
		effectiveAtkVal: effAtk,
		skillConstant: skill.skillConstant ?? 0,
		skillMultiplier: skill.skillMultiplier,
		activeBuff: skill.activeBuff ?? 0,
		proration: skill.proration ?? 100,
		passiveBuff: skill.passiveBuff ?? 0,
		dtePlusElement: dteElement,
		zeroStanceLv: skill.zeroStanceLv ?? 0,
		rangeDamage: rangeDmg,
		comboMultiplier: skill.comboMultiplier ?? 100,
		criticalDamage: playerStats.criticalDamage
	});

	// --- Graze range ---
	const graze = F.grazeRange(maxDmg, playerStats.stability);

	// --- Hit rate (uses skill mpCost) ---
	const hr = F.hitRate(playerStats.accuracy, effEnemyFlee, skill.mpCost ?? 0);

	return {
		maxDmg,
		graze,
		hitRate: hr,
		breakdown: {
			bDmg,
			effDef,
			effAtk,
			rangeDmg,
			dteElement,
			zeroStanceLv: skill.zeroStanceLv ?? 0,
			piercePercent: skill.piercePercent ?? 0
		}
	};
}

/**
 * Compute damage for a multi-hit skill.
 * Takes an array of hit definitions (from resolveSkillHits) and computes
 * damage for each hit individually, then aggregates totals.
 * 
 * @param {Object} playerStats - output from computeStats()
 * @param {EnemyContext} enemy
 * @param {Array<Object>} hits - Array of resolved hit params from resolveSkillHits()
 * @param {{ activeBuff: number, passiveBuff: number, proration: number, comboMultiplier: number, dte: number, elementStat: number, zeroStanceLv: number }} globalCtx - Shared buff/context parameters
 * @param {number} [playerLevel]
 * @returns {Object} { hits: Array<{ hitId, label, maxDmg, graze, hitRate, breakdown, perTargetDmg? }>, totalDmg: number, totalMaxDmg: number, avgDmg: number, totalAvgDmg: number, hitRate: number }
 */
export function calcDamageMultiHit(playerStats, enemy, hits, globalCtx, playerLevel) {
	const level = playerLevel ?? 0;
	const effEnemyDef = enemy.def * (enemy.difficultyStatMult ?? 1);
	const effEnemyLv = enemy.level + (enemy.difficultyLvOffset ?? 0);
	const effEnemyFlee = enemy.flee * (enemy.difficultyStatMult ?? 1);

	// Common base damage (shared across hits since it's based on ATK float vs enemy)
	const bDmg = F.baseDamage(
		playerStats.atkFloat,
		level,
		effEnemyLv,
		enemy.resistPct ?? 0,
		enemy.weaponResistPct ?? 0
	);

	const dteElement = (globalCtx.dte ?? 0) + (globalCtx.elementStat ?? 0);

	const hitResults = hits.map((hit) => {
		// Per-hit effective DEF with this hit's pierce
		const effDef = F.effectiveDef(effEnemyDef, hit.pierce ?? 0);
		const effAtk = F.effectiveAtk(bDmg, effDef);

		// Per-hit range damage
		const rangeDmg =
			hit.rangeDamage != null
				? hit.rangeDamage
				: hit.rangeType === 'short'
					? (playerStats.shortRangeDamagePercent ?? 0)
					: hit.rangeType === 'long'
						? (playerStats.longRangeDamagePercent ?? 0)
						: 0;

		// Per-hit damage (mult is already fully resolved by skill data)
		const maxDmg = F.maxDamage({
			effectiveAtkVal: effAtk,
			skillConstant: hit.const ?? 0,
			skillMultiplier: hit.mult,
			activeBuff: globalCtx.activeBuff ?? 0,
			proration: globalCtx.proration ?? 100,
			passiveBuff: globalCtx.passiveBuff ?? 0,
			dtePlusElement: dteElement,
			zeroStanceLv: globalCtx.zeroStanceLv ?? 0,
			rangeDamage: rangeDmg,
			comboMultiplier: globalCtx.comboMultiplier ?? 100,
			criticalDamage: playerStats.criticalDamage
		});

		const graze = F.grazeRange(maxDmg, playerStats.stability);
		const hr = F.hitRate(playerStats.accuracy, effEnemyFlee, hit.mpCost ?? 0);

		return {
			hitId: hit.id,
			label: hit.label,
			hitCount: hit.hitCount ?? 1,
			splitDamage: hit.splitDamage ?? false,
			maxDmg,
			graze,
			hitRate: hr,
			breakdown: {
				bDmg,
				effDef,
				effAtk,
				rangeDmg,
				dteElement,
				piercePercent: hit.pierce ?? 0,
				skillMult: hit.mult,
				skillConst: hit.const ?? 0
			}
		};
	});

	// Aggregate totals
	// If splitDamage, total is just the per-hit value (since it's already split)
	// If not splitDamage, multiply by hitCount
	let totalMaxDmg = 0;
	let totalAvgDmg = 0;

	for (const hr of hitResults) {
		if (hr.splitDamage) {
			// Damage already split among hits, take the max as total
			totalMaxDmg = Math.max(totalMaxDmg, hr.maxDmg);
			totalAvgDmg = Math.max(totalAvgDmg, hr.graze.avg);
		} else {
			totalMaxDmg += hr.maxDmg * (hr.hitCount ?? 1);
			totalAvgDmg += hr.graze.avg * (hr.hitCount ?? 1);
		}
	}

	// Overall hit rate = worst hit rate among hits (conservative)
	const overallHitRate = Math.min(...hitResults.map((h) => h.hitRate));

	return {
		hits: hitResults,
		totalMaxDmg,
		totalAvgDmg,
		hitRate: overallHitRate
	};
}

/**
 * Simplified convenience: calc damage using element advantage
 * @param {Object} playerStats
 * @param {EnemyContext} enemy
 * @param {SkillContext} skill
 * @param {string} attackerElement
 * @param {string} targetElement
 * @param {number} [playerLevel]
 * @returns {Object}
 */
export function calcDamageWithElement(
	playerStats,
	enemy,
	skill,
	attackerElement,
	targetElement,
	playerLevel
) {
	// Element advantage = +25% bonus, folded into DTE+Element sum
	// Per formula: (1 + (DTE + ElementStat)/100)
	const elemBonus = F.isElementAdvantage(attackerElement, targetElement) ? 25 : 0;

	return calcDamage(
		playerStats,
		enemy,
		{
			...skill,
			elementStat: (skill.elementStat ?? 0) + elemBonus
		},
		playerLevel
	);
}
