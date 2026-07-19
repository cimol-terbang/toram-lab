/**
 * @file Formula Engine — pure functions for all Toram formulas
 * Every function is a pure computation with no side effects.
 * Organized by section number matching the reference doc.
 */

// ─── Helpers ────────────────────────────────────────────────────────────
const floor = Math.floor;
const min = Math.min;
const max = Math.max;

/**
 * Universal stat scaling: floor(base × (1 + %/100)) + flat
 * @param {number} base
 * @param {number} [pct=0]
 * @param {number} [flat=0]
 * @returns {number}
 */
function scale(base, pct = 0, flat = 0) {
	return floor(base * (1 + pct / 100)) + flat;
}

// ─── Section 1: Primary Stats (handled in stat-block.js) ───────────────
// effectiveStat(base, flat, pct) = base + flat + floor(base * pct / 100)

// ─── Section 2: Weapon ATK ─────────────────────────────────────────────
/**
 * @param {number} itemBaseAtk
 * @param {number} refine 0..15
 * @param {number} equipWatkPct equipment WATK% (not skill buffs)
 * @param {number} flatWatk
 * @returns {number}
 */
export function weaponBaseAtk(itemBaseAtk, refine, equipWatkPct = 0, flatWatk = 0) {
	return itemBaseAtk * (1 + refine ** 2 / 100 + equipWatkPct / 100) + refine + flatWatk;
}

// ─── Section 3: Refine Bonus ───────────────────────────────────────────
/**
 * For weapons or armor
 * @param {number} baseStat Item Base ATK or Item Base DEF
 * @param {number} refine 0..15
 * @returns {number}
 */
export function refineBonus(baseStat, refine) {
	return floor((baseStat * refine ** 2) / 100) + refine;
}

// ─── Section 4: Character ATK & MATK ───────────────────────────────────

/**
 * @param {number} level
 * @param {number} statAtk  from weapon type formula
 * @param {number} weaponBaseAtkVal from section 2
 * @param {number} atkPct ATK%
 * @param {number} flatAtk
 * @returns {number}
 */
export function atk(level, statAtk, weaponBaseAtkVal, atkPct = 0, flatAtk = 0) {
	const base = level + statAtk + weaponBaseAtkVal;
	return scale(base, atkPct, flatAtk);
}

/**
 * @param {number} level
 * @param {number} statMatk from weapon type formula
 * @param {number} weaponMatk weapon MATK value
 * @param {number} matkPct MATK%
 * @param {number} flatMatk
 * @returns {number}
 */
export function matk(level, statMatk, weaponMatk, matkPct = 0, flatMatk = 0) {
	const base = level + statMatk + weaponMatk;
	return scale(base, matkPct, flatMatk);
}

// ─── Section 5: Stability ──────────────────────────────────────────────

/**
 * @param {number} weaponStab base stability % printed on weapon
 * @param {number} statStab stability from stats (weapon-dependent)
 * @param {number} stabilityPct flat Stability% bonus from equip/crystas
 * @returns {number}
 */
export function stability(weaponStab, statStab, stabilityPct = 0) {
	return max(0, min(100, floor(weaponStab + statStab) + stabilityPct));
}

// ─── Section 6: Attack Speed (ASPD) ────────────────────────────────────

/**
 * @param {number} statAspd from weapon type formula
 * @param {number} weaponAspd flat weapon ASPD
 * @param {number} level
 * @param {number} aspdPct ASPD%
 * @param {number} flatAspd
 * @returns {number}
 */
export function aspd(statAspd, weaponAspd, level, aspdPct = 0, flatAspd = 0) {
	const base = statAspd + weaponAspd + level;
	return scale(base, aspdPct, flatAspd);
}

// ─── Section 7: Cast Speed & Cast Motion Speed ─────────────────────────

/**
 * @param {number} level
 * @param {number} agi
 * @param {number} dex
 * @param {number} cspdPct CSPD%
 * @param {number} flatCspd
 * @returns {number}
 */
export function cspd(level, agi, dex, cspdPct = 0, flatCspd = 0) {
	const base = floor(level + agi * 1.16 + dex * 2.94);
	return scale(base, cspdPct, flatCspd);
}

/**
 * @param {number} cspdVal computed CSPD
 * @returns {number} cast motion speed bonus (0-50+)
 */
export function castMotionSpeed(cspdVal) {
	return min(50, cspdVal / 20) + max(0, (cspdVal - 1000) / 180);
}

// ─── Section 8: Motion Speed ───────────────────────────────────────────

/**
 * @param {number} aspdVal computed ASPD
 * @returns {number}
 */
export function motionSpeedFromAspd(aspdVal) {
	return min(50, max(0, floor((aspdVal - 1000) / 180)));
}

/**
 * @param {number} aspdVal
 * @param {number} motionSpeedPct Motion Speed% from equip
 * @returns {number}
 */
export function totalMotionSpeed(aspdVal, motionSpeedPct = 0) {
	return motionSpeedFromAspd(aspdVal) + motionSpeedPct;
}

// ─── Section 9: Max HP ─────────────────────────────────────────────────

/**
 * @param {number} level
 * @param {number} vit effective VIT
 * @param {number} hpPct MaxHP%
 * @param {number} flatHp
 * @returns {number}
 */
export function maxHp(level, vit, hpPct = 0, flatHp = 0) {
	const base = floor(93 + (level / 3) * (vit + 22.41));
	return scale(base, hpPct, flatHp);
}

// ─── Section 10: Max MP ────────────────────────────────────────────────

/**
 * @param {number} level
 * @param {number} intStat effective INT
 * @param {number} tec TEC value
 * @param {number} mpPct MaxMP%
 * @param {number} flatMp
 * @returns {number}
 */
export function maxMp(level, intStat, tec = 0, mpPct = 0, flatMp = 0) {
	const base = floor(99 + intStat / 10 + tec + level);
	return min(2000, floor(base * (1 + mpPct / 100) + flatMp));
}

// ─── Section 11: Natural HP Regen ───────────────────────────────────────

/**
 * @param {number} maxHpVal computed Max HP
 * @param {number} nHprPct NHPR%
 * @param {number} flatNHPR
 * @returns {number} Base NHPR (before Short Rest/Emote/Sunbath)
 */
export function baseNhpr(maxHpVal, nHprPct = 0, flatNHPR = 0) {
	return floor(floor(maxHpVal / 25) * (1 + nHprPct / 100)) + flatNHPR + 1;
}

/**
 * @param {number} baseNhprVal
 * @param {number} shortRestLv Short Rest skill level
 * @param {number} [emote] 2.0 if active, else 1.0
 * @param {number} [sunbath] 1.5 if active, else 1.0
 * @returns {number}
 */
export function totalNhpr(baseNhprVal, shortRestLv = 0, emote = 1, sunbath = 1) {
	return floor(baseNhprVal * (1 + shortRestLv * 0.05) * emote * sunbath);
}

// ─── Section 12: Natural MP Regen ───────────────────────────────────────

/**
 * @param {number} maxMpVal computed Max MP
 * @param {number} nMprPct NMPR%
 * @param {number} flatNMPR
 * @returns {number}
 */
export function baseNmpr(maxMpVal, nMprPct = 0, flatNMPR = 0) {
	return floor(floor(maxMpVal / 100) * (1 + nMprPct / 100)) + flatNMPR + 1;
}

/** Same modifiers as NHPR */
export const totalNmpr = totalNhpr;

// ─── Section 13: Attack MP Recovery ────────────────────────────────────

/**
 * @param {number} maxMpVal computed Max MP
 * @param {number} amprPct AMPR%
 * @param {number} flatAmpr
 * @returns {number}
 */
export function ampr(maxMpVal, amprPct = 0, flatAmpr = 0) {
	const base = floor(10 + min(20, maxMpVal / 100));
	return floor(base * (1 + amprPct / 100)) + flatAmpr;
}

// ─── Section 14: DEF & MDEF ────────────────────────────────────────────

/**
 * @param {number} equipBaseDef includes armor refine bonus
 * @param {number} level
 * @param {number} vit
 * @param {number} defPct DEF%
 * @param {number} flatDef
 * @returns {number}
 */
export function def(equipBaseDef, level, vit, defPct = 0, flatDef = 0) {
	const base = floor(equipBaseDef + level + vit);
	return scale(base, defPct, flatDef);
}

/**
 * @param {number} equipBaseDef includes armor refine bonus
 * @param {number} level
 * @param {number} intStat
 * @param {number} mdefPct MDEF%
 * @param {number} flatMdef
 * @returns {number}
 */
export function mdef(equipBaseDef, level, intStat, mdefPct = 0, flatMdef = 0) {
	const base = floor(equipBaseDef + level + intStat);
	return scale(base, mdefPct, flatMdef);
}

// ─── Section 15: Flee ──────────────────────────────────────────────────

/**
 * @param {number} level
 * @param {number} agi
 * @param {number} dodgePct Dodge%
 * @param {number} flatDodge
 * @returns {number}
 */
export function flee(level, agi, dodgePct = 0, flatDodge = 0) {
	const base = floor(level + agi);
	return scale(base, dodgePct, flatDodge);
}

// ─── Section 16: Accuracy ──────────────────────────────────────────────

/**
 * @param {number} level
 * @param {number} dex
 * @param {number} accPct ACC%
 * @param {number} flatAcc
 * @returns {number}
 */
export function accuracy(level, dex, accPct = 0, flatAcc = 0) {
	const base = level + dex;
	return scale(base, accPct, flatAcc);
}

// ─── Section 17: Critical Rate ─────────────────────────────────────────

/**
 * @param {number} crt effective CRT
 * @param {number} crPct CR%
 * @param {number} flatCr
 * @returns {number}
 */
export function criticalRate(crt, crPct = 0, flatCr = 0) {
	const base = floor(25 + crt / 3.4);
	return floor(base * (1 + crPct / 100)) + flatCr;
}

// ─── Section 18: Critical Damage ───────────────────────────────────────

/**
 * @param {number} str effective STR
 * @param {number} agi effective AGI
 * @param {number} cdPct CD%
 * @param {number} flatCd
 * @returns {number}
 */
export function criticalDamage(str, agi, cdPct = 0, flatCd = 0) {
	const base = str > agi ? 150 + str / 5 : 150 + (str + agi) / 10;
	const raw = floor(base * (1 + cdPct / 100)) + flatCd;
	// softcap at 300
	return raw > 300 ? 300 + floor((raw - 300) / 2) : raw;
}

// ─── Section 19: Magic Critical Rate ───────────────────────────────────

/**
 * @param {number} critRateVal computed Critical Rate
 * @param {number} mcrConversionPct total MCR conversion %
 * @returns {number}
 */
export function magicCriticalRate(critRateVal, mcrConversionPct) {
	return floor((critRateVal * mcrConversionPct) / 100);
}

// ─── Section 20: Magic Critical Damage ─────────────────────────────────

/**
 * @param {number} critDamageVal computed Critical Damage
 * @param {number} cdRatioPct total CD Ratio %
 * @returns {number}
 */
export function magicCriticalDamage(critDamageVal, cdRatioPct) {
	return floor(100 + ((critDamageVal - 100) * cdRatioPct) / 100);
}

// ─── Section 21: Hit Rate ──────────────────────────────────────────────

/**
 * @param {number} playerAcc accuracy value
 * @param {number} enemyFlee
 * @param {number} skillMpCost skill MP cost
 * @returns {number} 0..100
 */
export function hitRate(playerAcc, enemyFlee, skillMpCost = 0) {
	return min(100, max(0, floor(100 - (enemyFlee - playerAcc) / 3 + skillMpCost / 10)));
}

// ─── Section 22: Damage Formula ────────────────────────────────────────

/**
 * Step 1: Base Damage (uses unfloored ATK float)
 * @param {number} atkFloat the un-floored ATK value
 * @param {number} level player level
 * @param {number} enemyLevel
 * @param {number} resistPct enemy physical/magic resistance %
 * @param {number} weaponResistPct enemy weapon-specific resistance %
 * @returns {number}
 */
export function baseDamage(atkFloat, level, enemyLevel, resistPct = 0, weaponResistPct = 0) {
	return floor(
		(atkFloat + level - enemyLevel) * (1 - resistPct / 100) * (1 - weaponResistPct / 100)
	);
}

/**
 * Step 2: Effective DEF
 * @param {number} enemyDef
 * @param {number} piercePct 0..100 (capped at 100)
 * @returns {number}
 */
export function effectiveDef(enemyDef, piercePct = 0) {
	return floor(enemyDef * (1 - min(100, piercePct) / 100));
}

/**
 * Step 3: Effective ATK
 */
export function effectiveAtk(baseDmg, effDef) {
	return Math.max(0, baseDmg - effDef);
}

/**
 * Step 4: Full Damage Chain (single floor at end)
 *
 * All factors chain together with ONE floor at the very end.
 * This is the critical formula — no intermediate rounding anywhere.
 *
 * @param {Object} params
 * @param {number} params.effectiveAtkVal
 * @param {number} params.skillConstant
 * @param {number} params.skillMultiplier  (e.g. 100 = ×1.0 for auto attack)
 * @param {number} [params.activeBuff] (e.g. Brave Aura) - additive %
 * @param {number} [params.proration]  250 for physical starter, 100 for normal
 * @param {number} [params.passiveBuff] (e.g. Sword Techniques) - additive %
 * @param {number} [params.dtePlusElement] DTE% + Element Stat% (additive inside)
 * @param {number} [params.zeroStanceLv]
 * @param {number} [params.rangeDamage] Short/Long Range Damage%
 * @param {number} [params.comboMultiplier] 100 for opener/standalone, 150 for Smite
 * @param {number} params.criticalDamage computed CD value (always applied)
 * @returns {number} Final damage (floored once)
 */
export function maxDamage({
	effectiveAtkVal,
	skillConstant = 0,
	skillMultiplier = 100,
	activeBuff = 0,
	proration = 100,
	passiveBuff = 0,
	dtePlusElement = 0,
	zeroStanceLv = 0,
	rangeDamage = 0,
	comboMultiplier = 100,
	criticalDamage: critDmg
}) {
	return floor(
		(effectiveAtkVal + skillConstant) *
			(skillMultiplier / 100) *
			(1 + activeBuff / 100) *
			(proration / 100) *
			(1 + passiveBuff / 100) *
			(1 + dtePlusElement / 100) *
			(1 + zeroStanceLv / 100) *
			(1 + rangeDamage / 100) *
			(comboMultiplier / 100) *
			(critDmg / 100)
	);
}

// ─── Section 23: Graze (Stability Damage Range) ────────────────────────

/**
 * @param {number} maxDmgVal from maxDamage
 * @param {number} stabilityVal 0..100
 * @returns {{ min: number, max: number, avg: number }}
 */
export function grazeRange(maxDmgVal, stabilityVal) {
	const minDmg = floor(0.5 * (stabilityVal / 100) * maxDmgVal);
	return {
		min: minDmg,
		max: maxDmgVal,
		avg: floor((minDmg + maxDmgVal) / 2)
	};
}

// ─── Section 26: Elemental Effectiveness ───────────────────────────────

/** Element cycle: Fire → Earth → Wind → Water → Fire, Light ↔ Dark */
const ELEMENT_CYCLE = {
	fire: 'earth',
	earth: 'wind',
	wind: 'water',
	water: 'fire',
	light: 'dark',
	dark: 'light'
};

/**
 * @param {string} attackerElement
 * @param {string} targetElement
 * @returns {boolean}
 */
export function isElementAdvantage(attackerElement, targetElement) {
	return ELEMENT_CYCLE[attackerElement] === targetElement;
}

/**
 * @param {string} attackerElement
 * @param {string} targetElement
 * @returns {number} 1.25 if advantage, 1.0 otherwise
 */
export function elementMultiplier(attackerElement, targetElement) {
	return isElementAdvantage(attackerElement, targetElement) ? 1.25 : 1.0;
}
