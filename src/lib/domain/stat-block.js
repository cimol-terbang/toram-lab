/**
 * @file Domain: stat block value object
 * Immutable container for all stat values (raw allocated stats + equipment bonuses).
 */

/**
 * @typedef {Object} RawStats
 * @property {number} str Base STR allocated by player
 * @property {number} int Base INT
 * @property {number} vit Base VIT
 * @property {number} agi Base AGI
 * @property {number} dex Base DEX
 * @property {number} crt Base CRT
 * @property {number} tec Base TEC
 * @property {number} luk Base LUK
 * @property {number} mtl Base MTL
 */

/**
 * @typedef {Object} EquipBonuses
 * Flat and percent bonuses from equipment/crystas
 * @property {number} [str] STR+
 * @property {number} [strPercent] STR%
 * @property {number} [int] INT+
 * @property {number} [intPercent] INT%
 * @property {number} [vit] VIT+
 * @property {number} [vitPercent] VIT%
 * @property {number} [agi] AGI+
 * @property {number} [agiPercent] AGI%
 * @property {number} [dex] DEX+
 * @property {number} [dexPercent] DEX%
 * @property {number} [atk] ATK+
 * @property {number} [atkPercent] ATK%
 * @property {number} [matk] MATK+
 * @property {number} [matkPercent] MATK%
 * @property {number} [weaponAtk] Weapon ATK+
 * @property {number} [weaponAtkPercent] Weapon ATK%
 * @property {number} [aspeed] ASPD+
 * @property {number} [aspeedPercent] ASPD%
 * @property {number} [cspd] CSPD+
 * @property {number} [cspdPercent] CSPD%
 * @property {number} [accuracy] Accuracy+
 * @property {number} [accuracyPercent] ACC%
 * @property {number} [dodge] Dodge+
 * @property {number} [dodgePercent] Dodge%
 * @property {number} [criticalRate] Critical Rate+
 * @property {number} [criticalRatePercent] CR%
 * @property {number} [criticalDamage] Critical Damage+
 * @property {number} [criticalDamagePercent] CD%
 * @property {number} [maxHp] MaxHP+
 * @property {number} [maxHpPercent] MaxHP%
 * @property {number} [maxMp] MaxMP+
 * @property {number} [maxMpPercent] MaxMP%
 * @property {number} [naturalHpRegen] NHPR+
 * @property {number} [naturalHpRegenPercent] NHPR%
 * @property {number} [naturalMpRegen] NMPR+
 * @property {number} [naturalMpRegenPercent] NMPR%
 * @property {number} [attackMpRecovery] AMPR+
 * @property {number} [attackMpRecoveryPercent] AMPR%
 * @property {number} [def] DEF+
 * @property {number} [defPercent] DEF%
 * @property {number} [mdef] MDEF+
 * @property {number} [mdefPercent] MDEF%
 * @property {number} [stabilityPercent] Stability% flat bonus
 * @property {number} [motionSpeedPercent] Motion Speed%
 * @property {number} [physicalPiercePercent] Physical Pierce%
 * @property {number} [magicPiercePercent] Magic Pierce%
 * @property {number} [shortRangeDamagePercent] Short Range Damage%
 * @property {number} [longRangeDamagePercent] Long Range Damage%
 * @property {number} [damageToBossPercent] Damage to Boss%
 * @property {number} [elementStat] Weapon's own element stat
 * @property {number} [dte] Damage to Element%
 * @property {number} [aggroPercent] Aggro%
 */

export class StatBlock {
	/**
	 * @param {RawStats} raw
	 * @param {EquipBonuses} equip
	 */
	constructor(raw, equip = {}) {
		this.raw = { ...raw };
		this.equip = { ...equip };
		Object.freeze(this.raw);
	}

	/** Effective STR after flat & percent bonuses */
	get effStr() {
		return effectiveStat(this.raw.str, this.equip.str, this.equip.strPercent);
	}
	get effInt() {
		return effectiveStat(this.raw.int, this.equip.int, this.equip.intPercent);
	}
	get effVit() {
		return effectiveStat(this.raw.vit, this.equip.vit, this.equip.vitPercent);
	}
	get effAgi() {
		return effectiveStat(this.raw.agi, this.equip.agi, this.equip.agiPercent);
	}
	get effDex() {
		return effectiveStat(this.raw.dex, this.equip.dex, this.equip.dexPercent);
	}

	get effCrt() {
		return this.raw.crt ?? 0;
	}
	get effTec() {
		return this.raw.tec ?? 0;
	}
	get effLuk() {
		return this.raw.luk ?? 0;
	}
	get effMtl() {
		return this.raw.mtl ?? 0;
	}

	/** @returns {{ str:number, int:number, vit:number, agi:number, dex:number, crt:number, tec:number, luk:number, mtl:number }} */
	get effectiveStats() {
		return {
			str: this.effStr,
			int: this.effInt,
			vit: this.effVit,
			agi: this.effAgi,
			dex: this.effDex,
			crt: this.effCrt,
			tec: this.effTec,
			luk: this.effLuk,
			mtl: this.effMtl
		};
	}

	/** @returns {number} Current level (passed through from Character) */
	get level() {
		return this._level ?? 1;
	}
	set level(v) {
		this._level = v;
	}

	clone(overrides = {}) {
		return new StatBlock({ ...this.raw, ...overrides.raw }, { ...this.equip, ...overrides.equip });
	}
}

/**
 * Section 1: Effective stat formula
 * @param {number} base
 * @param {number} [flat=0]
 * @param {number} [percent=0]
 * @returns {number}
 */
export function effectiveStat(base, flat = 0, percent = 0) {
	return base + flat + Math.floor((base * percent) / 100);
}
