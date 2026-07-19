/**
 * @file Domain: Character entity
 * Aggregates stat block, weapon, level, and provides derived stat hook points.
 */

import { StatBlock } from './stat-block.js';
import { getWeaponContribution } from './constants/weapon-types.js';

export class Character {
	/**
	 * @param {Object} config
	 * @param {number} config.level
	 * @param {import('./stat-block.js').RawStats} config.rawStats
	 * @param {import('./stat-block.js').EquipBonuses} [config.equipBonuses]
	 * @param {string} config.weaponType - key from WEAPON_CONTRIBUTIONS
	 * @param {Object} [config.weapon] - weapon data
	 * @param {number} config.weapon.itemBaseAtk
	 * @param {number} config.weapon.refine - 0..15
	 * @param {Object} [config.armor]
	 * @param {number} [config.armor.itemBaseDef]
	 * @param {number} [config.armor.refine]
	 */
	constructor(config) {
		this.level = config.level ?? 1;
		this.stats = new StatBlock(config.rawStats, config.equipBonuses);
		this.stats.level = this.level;
		this.weaponType = config.weaponType ?? 'barehand';
		this.wc = getWeaponContribution(this.weaponType);
		if (!this.wc) throw new Error(`Unknown weapon type: ${this.weaponType}`);
		this.weapon = config.weapon ?? { itemBaseAtk: 0, refine: 0 };
		this.armor = config.armor ?? { itemBaseDef: 0, refine: 0 };
	}

	/** @returns {{ str:number, int:number, vit:number, agi:number, dex:number }} */
	get s() {
		return this.stats.effectiveStats;
	}

	clone(overrides = {}) {
		return new Character({
			level: overrides.level ?? this.level,
			rawStats: { ...this.stats.raw, ...(overrides.rawStats ?? {}) },
			equipBonuses: { ...this.stats.equip, ...(overrides.equipBonuses ?? {}) },
			weaponType: overrides.weaponType ?? this.weaponType,
			weapon: { ...this.weapon, ...(overrides.weapon ?? {}) },
			armor: { ...this.armor, ...(overrides.armor ?? {}) }
		});
	}
}
