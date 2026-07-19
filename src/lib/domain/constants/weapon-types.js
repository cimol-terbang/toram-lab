/**
 * @file Domain: weapon type definitions with stat contribution data
 * All formulas from Section 24 of the formula reference.
 */

/**
 * @typedef {'oneHandedSword'|'twoHandedSword'|'bow'|'bowgun'|'staff'|'magicDevice'|'knuckles'|'halberd'|'katana'|'barehand'} WeaponType
 */

/**
 * @typedef {Object} WeaponStatContribution
 * @property {string} label Display name
 * @property {(str:number,dex:number,int:number,agi:number) => number} statAtkFn Stat ATK formula
 * @property {(str:number,dex:number,int:number,agi:number) => number} statMatkFn Stat MATK formula
 * @property {(str:number,dex:number,int:number,agi:number) => number} stabilityFn Stability from stats
 * @property {(str:number,dex:number,int:number,agi:number) => number} statAspdFn Stat ASPD formula
 * @property {number} weaponAspd Flat weapon ASPD
 * @property {boolean} weaponBaseAddedToMatk Whether weapon base ATK is added to MATK stat
 */

/** @type {Record<string, WeaponStatContribution>} */
export const WEAPON_CONTRIBUTIONS = {
	oneHandedSword: {
		label: '1H Sword',
		statAtkFn: (str, dex, _int, _agi) => str * 2 + dex * 2,
		statMatkFn: (_str, dex, int, _agi) => int * 3 + dex,
		stabilityFn: (str, dex, _int, _agi) => str * 0.025 + dex * 0.075,
		statAspdFn: (str, _dex, _int, agi) => str * 0.2 + agi * 4.2,
		weaponAspd: 100,
		weaponBaseAddedToMatk: false
	},
	twoHandedSword: {
		label: '2H Sword',
		statAtkFn: (str, dex, _int, _agi) => str * 3 + dex,
		statMatkFn: (_str, dex, int, _agi) => int * 3 + dex,
		stabilityFn: (_str, dex, _int, _agi) => dex * 0.1,
		statAspdFn: (str, _dex, _int, agi) => str * 0.2 + agi * 2.1,
		weaponAspd: 50,
		weaponBaseAddedToMatk: false
	},
	bow: {
		label: 'Bow',
		statAtkFn: (str, dex, _int, _agi) => str + dex * 3,
		statMatkFn: (_str, dex, int, _agi) => int * 3 + dex,
		stabilityFn: (str, dex, _int, _agi) => str * 0.05 + dex * 0.05,
		statAspdFn: (_str, dex, _int, agi) => dex * 0.2 + agi * 3.1,
		weaponAspd: 75,
		weaponBaseAddedToMatk: false
	},
	bowgun: {
		label: 'Bowgun',
		statAtkFn: (_str, dex, _int, _agi) => dex * 4,
		statMatkFn: (_str, dex, int, _agi) => int * 3 + dex,
		stabilityFn: (str, _dex, _int, _agi) => str * 0.05,
		statAspdFn: (_str, dex, _int, agi) => dex * 0.2 + agi * 2.2,
		weaponAspd: 30,
		weaponBaseAddedToMatk: false
	},
	staff: {
		label: 'Staff',
		statAtkFn: (str, dex, _int, _agi) => str * 3 + dex,
		statMatkFn: (_str, dex, int, _agi) => int * 4 + dex,
		stabilityFn: (str, _dex, _int, _agi) => str * 0.05,
		statAspdFn: (_str, _dex, int, agi) => int * 0.2 + agi * 1.8,
		weaponAspd: 60,
		weaponBaseAddedToMatk: true
	},
	magicDevice: {
		label: 'Magic Device',
		statAtkFn: (_str, _dex, int, agi) => int * 2 + agi * 2,
		statMatkFn: (_str, dex, int, _agi) => int * 4 + dex,
		stabilityFn: (_str, dex, _int, _agi) => dex * 0.1,
		statAspdFn: (_str, _dex, int, agi) => int * 0.2 + agi * 4.0,
		weaponAspd: 90,
		weaponBaseAddedToMatk: true
	},
	knuckles: {
		label: 'Knuckles',
		statAtkFn: (_str, dex, _int, agi) => agi * 2 + dex * 0.5,
		statMatkFn: (_str, dex, int, _agi) => int * 4 + dex,
		stabilityFn: (_str, dex, _int, _agi) => dex * 0.025,
		statAspdFn: (str, dex, _int, agi) => str * 0.1 + dex * 0.1 + agi * 4.6,
		weaponAspd: 120,
		weaponBaseAddedToMatk: false
	},
	halberd: {
		label: 'Halberd',
		statAtkFn: (str, _dex, _int, agi) => str * 2.5 + agi * 0.5,
		statMatkFn: (_str, dex, int, agi) => int * 2 + dex + agi,
		stabilityFn: (str, dex, _int, _agi) => str * 0.05 + dex * 0.05,
		statAspdFn: (str, _dex, _int, agi) => str * 0.2 + agi * 3.5,
		weaponAspd: 25,
		weaponBaseAddedToMatk: false
	},
	katana: {
		label: 'Katana',
		statAtkFn: (str, dex, _int, _agi) => str * 1.5 + dex * 2.5,
		statMatkFn: (_str, dex, int, _agi) => int * 1.5 + dex,
		stabilityFn: (str, dex, _int, _agi) => str * 0.075 + dex * 0.025,
		statAspdFn: (str, _dex, _int, agi) => str * 0.3 + agi * 3.9,
		weaponAspd: 200,
		weaponBaseAddedToMatk: false
	},
	barehand: {
		label: 'Barehand',
		statAtkFn: (_str, dex, _int, _agi) => dex,
		statMatkFn: (_str, dex, int, _agi) => int * 3 + dex,
		stabilityFn: (_str, dex, _int, _agi) => 1 + dex * 0.35,
		statAspdFn: (_str, _dex, _int, agi) => agi * 9.6,
		weaponAspd: 1000,
		weaponBaseAddedToMatk: false
	}
};

/** @type {string[]} All weapon type keys */
export const WEAPON_TYPES = Object.keys(WEAPON_CONTRIBUTIONS);

/**
 * Get weapon contribution data by type
 * @param {string} type
 * @returns {WeaponStatContribution|undefined}
 */
export function getWeaponContribution(type) {
	return WEAPON_CONTRIBUTIONS[type];
}
