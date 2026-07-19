/**
 * @file Aggregates item stat effects from items.json into equipBonuses + rawStatBoosts.
 * Bridges item-adapter → character-builder format.
 */

/** Reverse map: original stat label → internal equipBonuses key */
const LABEL_TO_KEY = {
	ATK: 'atk',
	'ATK %': 'atkPercent',
	'Weapon ATK': 'weaponAtk',
	'Weapon ATK %': 'weaponAtkPercent',
	MATK: 'matk',
	'MATK %': 'matkPercent',
	DEF: 'def',
	'DEF %': 'defPercent',
	MDEF: 'mdef',
	'MDEF %': 'mdefPercent',
	MaxHP: 'maxHp',
	'MaxHP %': 'maxHpPercent',
	MaxMP: 'maxMp',
	'MaxMP %': 'maxMpPercent',
	HP: 'hp',
	'HP %': 'hpPercent',
	MP: 'mp',
	'MP %': 'mpPercent',
	ASPD: 'aspeed',
	'ASPD %': 'aspeedPercent',
	CSPD: 'cspd',
	'CSPD %': 'cspdPercent',
	'Critical Rate': 'criticalRate',
	'Critical Rate %': 'criticalRatePercent',
	'Critical Damage': 'criticalDamage',
	'Critical Damage %': 'criticalDamagePercent',
	Accuracy: 'accuracy',
	'Accuracy %': 'accuracyPercent',
	Dodge: 'dodge',
	'Dodge %': 'dodgePercent',
	'Attack MP Recovery': 'attackMpRecovery',
	'Attack MP Recovery %': 'attackMpRecoveryPercent',
	'Natural HP Regen': 'naturalHpRegen',
	'Natural HP Regen %': 'naturalHpRegenPercent',
	'Natural MP Regen': 'naturalMpRegen',
	'Natural MP Regen %': 'naturalMpRegenPercent',
	'Stability %': 'stabilityPercent',
	'Base Stability %': 'baseStabilityPercent',
	'Physical Pierce %': 'physicalPiercePercent',
	'Magic Pierce %': 'magicPiercePercent',
	'Motion Speed %': 'motionSpeedPercent',
	'Short Range Damage %': 'shortRangeDamagePercent',
	'Long Range Damage %': 'longRangeDamagePercent',
	'Damage to Boss %': 'damageToBossPercent',
	'Aggro %': 'aggroPercent',
	'Guard Power %': 'guardPowerPercent',
	'Guard Break %': 'guardBreakPercent',
	'Guard Recharge %': 'guardRechargePercent',
	'Evasion Recharge %': 'evasionRechargePercent',
	'Fractional Barrier %': 'fractionalBarrierPercent',
	'Unsheathe Attack %': 'unsheatheAttackPercent',
	STR: 'str',
	INT: 'int',
	VIT: 'vit',
	AGI: 'agi',
	DEX: 'dex',
	'STR %': 'strPercent',
	'INT %': 'intPercent',
	'VIT %': 'vitPercent',
	'AGI %': 'agiPercent',
	'DEX %': 'dexPercent',
	TEC: 'tec',
	'Physical Resistance %': 'physicalResistancePercent',
	'Magic Resistance %': 'magicResistancePercent',
	'Neutral Resistance %': 'neutralResistancePercent',
	'Fire resistance %': 'fireResistancePercent',
	'Water resistance %': 'waterResistancePercent',
	'Wind resistance %': 'windResistancePercent',
	'Earth resistance %': 'earthResistancePercent',
	'Light resistance %': 'lightResistancePercent',
	'Dark resistance %': 'darkResistancePercent',

	// Element Awaken
	'Fire Element': 'fireElement',
	'Water Element': 'waterElement',
	'Wind Element': 'windElement',
	'Earth Element': 'earthElement',
	'Light Element': 'lightElement',
	'Dark Element': 'darkElement',
	'Fire Element (matching)': 'fireElementMatching',
	'Water Element (matching)': 'waterElementMatching',
	'Wind Element (matching)': 'windElementMatching',
	'Earth Element (matching)': 'earthElementMatching',
	'Light Element (matching)': 'lightElementMatching',
	'Dark Element (matching)': 'darkElementMatching',

	// Element ATK (DTE)
	'% stronger against Fire': 'elementAtkFirePercent',
	'% stronger against Water': 'elementAtkWaterPercent',
	'% stronger against Wind': 'elementAtkWindPercent',
	'% stronger against Earth': 'elementAtkEarthPercent',
	'% stronger against Light': 'elementAtkLightPercent',
	'% stronger against Dark': 'elementAtkDarkPercent',

	// Ailment Resistance
	'Ailment Resistance %': 'ailmentResistancePercent',

	// Reduce Dmg (area types)
	'Reduce Dmg (Player Epicenter) %': 'reduceDmgPlayerEpicenterPercent',
	'Reduce Dmg (Foe Epicenter) %': 'reduceDmgFoeEpicenterPercent',
	'Reduce Dmg (Straight Line) %': 'reduceDmgStraightLinePercent',
	'Reduce Dmg (Charge) %': 'reduceDmgChargePercent',
	'Reduce Dmg (Floor) %': 'reduceDmgFloorPercent',
	'Reduce Dmg (Bullet) %': 'reduceDmgBulletPercent',
	'Reduce Dmg (Bowling) %': 'reduceDmgBowlingPercent',
	'Reduce Dmg (Meteor) %': 'reduceDmgMeteorPercent'
};

/** Stat labels that go into raw stat boosts (not equipBonuses) */
const RAW_STAT_KEYS = new Set(['STR', 'INT', 'VIT', 'AGI', 'DEX']);

/**
 * Parse a stat value string → number.
 * Handles "%" suffix, decimals, negative.
 * @param {string} val
 * @returns {number}
 */
function parseStatValue(val) {
	if (typeof val === 'number') return val;
	return Number(val.replace('%', '').trim()) || 0;
}

/**
 * Aggregate stats from one or more items into the internal format.
 *
 * @param {Array<{ stats: { general: Record<string,string> } }>} items
 * @returns {{ rawBoosts: Record<string,number>, equip: Record<string,number> }}
 */
export function aggregateItemBonuses(items) {
	const rawBoosts = { str: 0, int: 0, vit: 0, agi: 0, dex: 0, crt: 0, tec: 0 };
	const equip = {};

	for (const item of items) {
		if (!item.stats?.general) continue;
		for (const [label, valStr] of Object.entries(item.stats.general)) {
			const key = LABEL_TO_KEY[label];
			if (!key) continue;
			const num = parseStatValue(valStr);

			if (RAW_STAT_KEYS.has(label)) {
				const lc = key.toLowerCase();
				if (lc in rawBoosts) rawBoosts[lc] += num;
			} else {
				equip[key] = (equip[key] ?? 0) + num;
			}
		}
	}

	return { rawBoosts, equip };
}

/**
 * Type → stat-label aliases used by items.json for base weapon data.
 * Items use labels like "Base ATK" for weapon ATK, "Base DEF" for armor DEF.
 * @param {string} typeLabel — e.g. "2 Handed Sword"
 * @returns {{ itemBaseAtk?: number, itemBaseDef?: number, baseStability?: number }}
 */
export function extractWeaponBase(item) {
	const g = item?.stats?.general ?? {};
	return {
		itemBaseAtk: g['Base ATK'] ? parseStatValue(g['Base ATK']) : undefined,
		baseStability:
			g['Base Stability %'] !== undefined ? parseStatValue(g['Base Stability %']) : undefined
	};
}

export function extractArmorBase(item) {
	const g = item?.stats?.general ?? {};
	return {
		itemBaseDef: g['Base DEF'] ? parseStatValue(g['Base DEF']) : undefined
	};
}