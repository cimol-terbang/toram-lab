/**
 * @file Provides a default build configuration for live stat previews.
 * STR-based 1H Sword DPS build with moderate equipment.
 */

import { Character } from '../domain/character.js';

/** @returns {Character} */
export function createDefaultCharacter() {
	return new Character({
		level: 245,
		rawStats: {
			str: 247,
			int: 1,
			vit: 40,
			agi: 94,
			dex: 126,
			crt: 0,
			tec: 0,
			luk: 0,
			mtl: 0
		},
		equipBonuses: {
			str: 35,
			strPercent: 15,
			dex: 20,
			dexPercent: 10,
			agi: 12,
			vit: 18,
			int: 8,
			atk: 250,
			atkPercent: 8,
			weaponAtk: 300,
			weaponAtkPercent: 20,
			matk: 50,
			maxHp: 1500,
			maxHpPercent: 12,
			maxMp: 300,
			maxMpPercent: 5,
			def: 200,
			defPercent: 10,
			mdef: 80,
			mdefPercent: 8,
			criticalRate: 28,
			criticalRatePercent: 12,
			criticalDamage: 18,
			criticalDamagePercent: 22,
			accuracy: 80,
			accuracyPercent: 10,
			dodge: 40,
			dodgePercent: 8,
			aspeed: 300,
			aspeedPercent: 15,
			cspd: 400,
			cspdPercent: 10,
			stabilityPercent: 5,
			motionSpeedPercent: 25,
			physicalPiercePercent: 15,
			attackMpRecovery: 5,
			attackMpRecoveryPercent: 10,
			naturalHpRegen: 100,
			naturalMpRegen: 20
		},
		weaponType: 'oneHandedSword',
		weapon: {
			itemBaseAtk: 285,
			refine: 9
		},
		armor: {
			itemBaseDef: 185,
			refine: 9
		}
	});
}
