/**
 * @file Application: Character Stat Calculator
 * Orchestrates domain → formula: computes all derived stats from a Character entity.
 */

import * as F from '../formula/index.js';
import { buildToCharacter, buildBareCharacter } from './character-builder.js';

/** Element order for display */
const ELEMENTS = ['fire', 'water', 'wind', 'earth', 'light', 'dark'];

/** Map element awaken equip key → element name */
const AWAKEN_KEY_TO_ELEM = {
	fireElement: 'Fire',
	waterElement: 'Water',
	windElement: 'Wind',
	earthElement: 'Earth',
	lightElement: 'Light',
	darkElement: 'Dark'
};

/**
 * Detect player element from awaken stats.
 * Weapon element = first awaken found with value >= 1.
 * Matching = same-name elementMatching stat also >= 1 (weapon + armor same element).
 */
function detectPlayerElement(equip) {
	for (const [key, elemName] of Object.entries(AWAKEN_KEY_TO_ELEM)) {
		if ((equip[key] ?? 0) >= 1) {
			const matchingKey = key + 'Matching';
			const isMatching = ELEMENTS.includes(elemName.toLowerCase()) && (equip[matchingKey] ?? 0) >= 1;
			return { playerElement: elemName, isMatching };
		}
	}
	return { playerElement: null, isMatching: false };
}

/**
 * Computes all derived stats for a character.
 * @param {Character} char
 * @returns {Object} All computed stats
 */
export function computeStats(char) {
	const { level, wc, s, stats, weapon, armor } = char;

	// --- Weapon ATK ---
	const watk = F.weaponBaseAtk(
		weapon.itemBaseAtk,
		weapon.refine,
		stats.equip.weaponAtkPercent ?? 0,
		stats.equip.weaponAtk ?? 0
	);

	// --- Stat ATK / Stat MATK ---
	const statAtk = wc.statAtkFn(s.str, s.dex, s.int, s.agi);
	const weaponMatk = wc.weaponBaseAddedToMatk ? watk : 0;
	const statMatk = wc.statMatkFn(s.str, s.dex, s.int, s.agi) + weaponMatk;

	// --- ATK float (unfloored, critical for damage formula) ---
	const atkBase = level + statAtk + watk;
	const atkFloat = atkBase * (1 + (stats.equip.atkPercent ?? 0) / 100);
	const atkFinal = F.atk(level, statAtk, watk, stats.equip.atkPercent, stats.equip.atk);

	// --- MATK ---
	const matkFinal = F.matk(level, statMatk, 0, stats.equip.matkPercent, stats.equip.matk);

	// --- Stability ---
	const statStab = wc.stabilityFn(s.str, s.dex, s.int, s.agi);
	const stabVal = F.stability(
		stats.equip.baseStabilityPercent ?? 80,
		statStab,
		stats.equip.stabilityPercent
	);

	// --- ASPD ---
	const statAspd = wc.statAspdFn(s.str, s.dex, s.int, s.agi);
	const aspdVal = F.aspd(
		statAspd,
		wc.weaponAspd,
		level,
		stats.equip.aspeedPercent,
		stats.equip.aspeed
	);

	// --- CSPD ---
	const cspdVal = F.cspd(level, s.agi, s.dex, stats.equip.cspdPercent, stats.equip.cspd);
	const castMotion = F.castMotionSpeed(cspdVal);

	// --- Motion Speed ---
	const motionSpeed = F.totalMotionSpeed(aspdVal, stats.equip.motionSpeedPercent);

	// --- MaxHP ---
	const hp = F.maxHp(level, s.vit, stats.equip.maxHpPercent, stats.equip.maxHp);

	// --- MaxMP — FIXED: use s.tec (personal stat) + stats.equip.tec (equip bonus) ---
	const tecTotal = (s.tec ?? 0) + (stats.equip.tec ?? 0);
	const mp = F.maxMp(level, s.int, tecTotal, stats.equip.maxMpPercent, stats.equip.maxMp);

	// --- AMPR ---
	const amprVal = F.ampr(mp, stats.equip.attackMpRecoveryPercent, stats.equip.attackMpRecovery);

	// --- NHPR ---
	const nhprBase = F.baseNhpr(hp, stats.equip.naturalHpRegenPercent, stats.equip.naturalHpRegen);
	const nhprTotal = F.totalNhpr(nhprBase);

	// --- NMPR ---
	const nmprBase = F.baseNmpr(mp, stats.equip.naturalMpRegenPercent, stats.equip.naturalMpRegen);
	const nmprTotal = F.totalNmpr(nmprBase);

	// --- DEF / MDEF ---
	const armorDef = armor.itemBaseDef
		? armor.itemBaseDef + F.refineBonus(armor.itemBaseDef, armor.refine)
		: 0;

	const defVal = F.def(armorDef, level, s.vit, stats.equip.defPercent, stats.equip.def);
	const mdefVal = F.mdef(armorDef, level, s.int, stats.equip.mdefPercent, stats.equip.mdef);

	// --- Flee / Accuracy ---
	const fleeVal = F.flee(level, s.agi, stats.equip.dodgePercent, stats.equip.dodge);
	const accVal = F.accuracy(level, s.dex, stats.equip.accuracyPercent, stats.equip.accuracy);

	// --- Element Awaken detect once ---
	const { playerElement, isMatching } = detectPlayerElement(stats.equip);

	// --- Critical ---
	const critRateVal = F.criticalRate(
		s.crt ?? 0,
		stats.equip.criticalRatePercent,
		stats.equip.criticalRate
	);
	const critDmgVal = F.criticalDamage(
		s.str,
		s.agi,
		stats.equip.criticalDamagePercent,
		stats.equip.criticalDamage
	);

	return {
		// Raw inputs for damage formula
		atkFloat,
		atk: atkFinal,
		matk: matkFinal,
		weaponAtk: watk,

		// Defensive
		def: defVal,
		mdef: mdefVal,
		flee: fleeVal,
		accuracy: accVal,
		maxHp: hp,
		maxMp: mp,

		// Speed
		aspd: aspdVal,
		cspd: cspdVal,
		castMotionSpeed: castMotion,
		motionSpeed,

		// Recovery
		ampr: amprVal,
		nhpr: nhprBase,
		nhprTotal,
		nmpr: nmprBase,
		nmprTotal,

		// Crit
		criticalRate: critRateVal,
		criticalDamage: critDmgVal,

		// Stability
		stability: stabVal,

		// --- Element Awaken ---
		playerElement,
		elementAwakenMatching: isMatching,
		elementAttack: {
			fire: stats.equip.elementAtkFirePercent ?? 0,
			water: stats.equip.elementAtkWaterPercent ?? 0,
			wind: stats.equip.elementAtkWindPercent ?? 0,
			earth: stats.equip.elementAtkEarthPercent ?? 0,
			light: stats.equip.elementAtkLightPercent ?? 0,
			dark: stats.equip.elementAtkDarkPercent ?? 0
		},

		// Ailment Resistance
		ailmentResistance: stats.equip.ailmentResistancePercent ?? 0,

		// Reduce Dmg (area types)
		reduceDmg: {
			playerEpicenter: stats.equip.reduceDmgPlayerEpicenterPercent ?? 0,
			foeEpicenter: stats.equip.reduceDmgFoeEpicenterPercent ?? 0,
			straightLine: stats.equip.reduceDmgStraightLinePercent ?? 0,
			charge: stats.equip.reduceDmgChargePercent ?? 0,
			floor: stats.equip.reduceDmgFloorPercent ?? 0,
			bullet: stats.equip.reduceDmgBulletPercent ?? 0,
			bowling: stats.equip.reduceDmgBowlingPercent ?? 0,
			meteor: stats.equip.reduceDmgMeteorPercent ?? 0
		},

		// Extra equip bonuses (already aggregated in stats.equip)
		pierce: {
			physical: stats.equip.physicalPiercePercent ?? 0,
			magic: stats.equip.magicPiercePercent ?? 0
		},
		damage: {
			shortRange: stats.equip.shortRangeDamagePercent ?? 0,
			longRange: stats.equip.longRangeDamagePercent ?? 0,
			toBoss: stats.equip.damageToBossPercent ?? 0,
			unsheathe: stats.equip.unsheatheAttackPercent ?? 0
		},
		guard: {
			power: stats.equip.guardPowerPercent ?? 0,
			break: stats.equip.guardBreakPercent ?? 0,
			recharge: stats.equip.guardRechargePercent ?? 0
		},
		evasion: {
			recharge: stats.equip.evasionRechargePercent ?? 0
		},
		resistance: {
			physical: stats.equip.physicalResistancePercent ?? 0,
			magic: stats.equip.magicResistancePercent ?? 0,
			neutral: stats.equip.neutralResistancePercent ?? 0,
			fire: stats.equip.fireResistancePercent ?? 0,
			water: stats.equip.waterResistancePercent ?? 0,
			wind: stats.equip.windResistancePercent ?? 0,
			earth: stats.equip.earthResistancePercent ?? 0,
			light: stats.equip.lightResistancePercent ?? 0,
			dark: stats.equip.darkResistancePercent ?? 0
		},
		barrier: {
			fractional: stats.equip.fractionalBarrierPercent ?? 0
		},
		aggro: stats.equip.aggroPercent ?? 0,

		// Raw personal stats (for reference)
		personalStats: {
			str: s.str,
			dex: s.dex,
			int: s.int,
			vit: s.vit,
			agi: s.agi,
			crt: s.crt,
			tec: s.tec,
			luk: s.luk,
			mtl: s.mtl
		}
	};
}

/**
 * Convenience: build → compute in one call.
 * Handles both full build and bare stat input.
 * @param {import('$lib/stores/buildStore.js').ActiveBuild|Object} input
 * @param {string} [weaponTypeKey]
 * @returns {Object} All computed stats
 */
export function computeCharacterStats(input, weaponTypeKey) {
	if (!input) return null;
	// If has equipment slots → full build; else bare stats
	const char = input.equipment
		? buildToCharacter(input)
		: buildBareCharacter(input, weaponTypeKey);
	return computeStats(char);
}