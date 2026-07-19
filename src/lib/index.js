/**
 * Toram Formula Engine — barrel exports
 */
export { Character } from './domain/character.js';
export { StatBlock, effectiveStat } from './domain/stat-block.js';
export {
	WEAPON_CONTRIBUTIONS,
	WEAPON_TYPES,
	getWeaponContribution
} from './domain/constants/weapon-types.js';
export * as Formula from './formula/index.js';
export { computeStats, computeCharacterStats } from './application/character-stat.js';
export { buildToCharacter, buildBareCharacter } from './application/character-builder.js';
export {
	aggregateItemBonuses,
	extractWeaponBase,
	extractArmorBase
} from './application/stat-aggregator.js';
export { calcDamage, calcDamageWithElement } from './application/damage-calculator.js';
