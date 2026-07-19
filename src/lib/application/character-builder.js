/**
 * @file Converts build store data → Character entity for computeStats()
 */

import { WEAPON_CONTRIBUTIONS } from '../domain/constants/weapon-types.js';
import { aggregateItemBonuses } from './stat-aggregator.js';

/**
 * Map item type label → weapon contribution key
 */
const TYPE_TO_WEAPON_KEY = {
	'1 Handed Sword': 'oneHandedSword',
	'2 Handed Sword': 'twoHandedSword',
	Bow: 'bow',
	Bowgun: 'bowgun',
	Staff: 'staff',
	'Magic Device': 'magicDevice',
	Knuckles: 'knuckles',
	Halberd: 'halberd',
	Katana: 'katana'
};

/**
 * Resolve personal stat values from store stat block.
 * @param {{ personalType?: string, personalValue?: number }} stat
 * @returns {{ crt: number, tec: number, luk: number, mtl: number }}
 */
function resolvePersonalStat(stat) {
	const personalType = stat.personalType ?? 'crt';
	const personalValue = stat.personalValue ?? 0;
	return {
		crt: personalType === 'crt' ? personalValue : 0,
		tec: personalType === 'tec' ? personalValue : 0,
		luk: personalType === 'luk' ? personalValue : 0,
		mtl: personalType === 'mtl' ? personalValue : 0
	};
}

/**
 * Collect all items + crysta from all equipment slots into a flat array.
 * @param {import('$lib/stores/buildStore.js').EquipmentSlots} eq
 * @returns {Array}
 */
function collectEquipmentItems(eq) {
	const items = [];
	for (const slotId of ['weapon', 'subWeapon', 'armor', 'additional', 'special']) {
		const slot = eq[slotId];
		if (slot?.item) {
			items.push(slot.item);
			if (slot.crysta) {
				for (const c of slot.crysta) {
					if (c) items.push(c);
				}
			}
		}
	}
	return items;
}

/**
 * Apply % bonuses then flat boosts to base stats: floor(base * (1 + %/100)) + flat
 */
function applyStatBonuses(base, percent, flat) {
	return Math.floor(base * (1 + (percent ?? 0) / 100)) + (flat ?? 0);
}

/**
 * Determine weapon type key from equipped weapon item.
 * @param {import('$lib/stores/buildStore.js').EquipmentSlots} eq
 * @returns {string}
 */
function resolveWeaponType(eq) {
	const weaponItem = eq.weapon?.item;
	return weaponItem
		? (TYPE_TO_WEAPON_KEY[weaponItem.type] ?? 'oneHandedSword')
		: 'oneHandedSword';
}

/**
 * Build a Character entity from the activeBuild store object.
 * Derives weapon type from equipped weapon item. Falls back to 1H Sword.
 * @param {import('$lib/stores/buildStore.js').ActiveBuild} build
 * @returns {import('$lib/domain/constants/weapon-types.js').Character}
 */
export function buildToCharacter(build) {
	const st = build.stat ?? {};
	const eq = build.equipment ?? {};

	const weaponTypeKey = resolveWeaponType(eq);
	const wc = WEAPON_CONTRIBUTIONS[weaponTypeKey];
	const personal = resolvePersonalStat(st);

	// Equipment base stats
	const weaponBase = eq.weapon?.item?.stats?.general ?? {};
	const armorBase = eq.armor?.item?.stats?.general ?? {};
	const itemBaseAtk = Number(weaponBase['Base ATK']) || 0;
	const itemBaseDef = Number(armorBase['Base DEF']) || 0;

	// Aggregate equipment bonuses
	const { rawBoosts, equip } = aggregateItemBonuses(collectEquipmentItems(eq));

	// Apply stat % bonuses + flat
	const s = {
		str: applyStatBonuses(st.str ?? 0, equip.strPercent, rawBoosts.str),
		dex: applyStatBonuses(st.dex ?? 0, equip.dexPercent, rawBoosts.dex),
		int: applyStatBonuses(st.int ?? 0, equip.intPercent, rawBoosts.int),
		vit: applyStatBonuses(st.vit ?? 0, equip.vitPercent, rawBoosts.vit),
		agi: applyStatBonuses(st.agi ?? 0, equip.agiPercent, rawBoosts.agi),
		crt: personal.crt + (rawBoosts.crt ?? 0),
		tec: personal.tec + (rawBoosts.tec ?? 0),
		luk: personal.luk,
		mtl: personal.mtl
	};

	return {
		level: st.level ?? 275,
		wc,
		s,
		stats: { equip },
		weapon: { itemBaseAtk, refine: eq.weapon?.refine ?? 0 },
		armor: { itemBaseDef, refine: eq.armor?.refine ?? 0 }
	};
}

/**
 * Build a bare Character from stats only (no equipment).
 * Useful for stat-optimizer page.
 * @param {Object} stat - stat block from store
 * @param {string} [weaponTypeKey='oneHandedSword']
 * @returns {import('$lib/domain/constants/weapon-types.js').Character}
 */
export function buildBareCharacter(stat, weaponTypeKey = 'oneHandedSword') {
	const wc = WEAPON_CONTRIBUTIONS[weaponTypeKey];
	const st = stat ?? {};
	const personal = resolvePersonalStat(st);

	return {
		level: st.level ?? 275,
		wc,
		s: {
			str: st.str ?? 0,
			dex: st.dex ?? 0,
			int: st.int ?? 0,
			vit: st.vit ?? 0,
			agi: st.agi ?? 0,
			crt: personal.crt,
			tec: personal.tec,
			luk: personal.luk,
			mtl: personal.mtl
		},
		stats: { equip: {} },
		weapon: { itemBaseAtk: 0, refine: 0 },
		armor: { itemBaseDef: 0, refine: 0 }
	};
}