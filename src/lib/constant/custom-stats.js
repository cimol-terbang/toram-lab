// ─── STAT DATABASE ───────────────────────────────────────────
// type: 'u'=universal, 'o'=offensive, 'd'=defensive, 'e'=element
// pot: potential cost per step (positive)
// baseCost: material cost for step 1
// mat: material type
// cat: category (for penalty calc)
// capSteps: hard cap on steps (null = level-based, default 20)
// bonusVal: value per step AFTER cap (null = same as before)
// noNeg: cannot be negative
export const STAT_DB = [
	// Enhance Stats
	{ name: 'STR',        type: 'u', cat: 'Enhance Stats',     pot: 5,  baseCost: 25,   mat: 'Beast',    capSteps: null },
	{ name: 'STR %',      type: 'u', cat: 'Enhance Stats',     pot: 10, baseCost: 50,   mat: 'Beast',    capSteps: null },
	{ name: 'INT',        type: 'u', cat: 'Enhance Stats',     pot: 5,  baseCost: 25,   mat: 'Wood',     capSteps: null },
	{ name: 'INT %',      type: 'u', cat: 'Enhance Stats',     pot: 10, baseCost: 50,   mat: 'Wood',     capSteps: null },
	{ name: 'VIT',        type: 'u', cat: 'Enhance Stats',     pot: 5,  baseCost: 25,   mat: 'Metal',    capSteps: null },
	{ name: 'VIT %',      type: 'u', cat: 'Enhance Stats',     pot: 10, baseCost: 50,   mat: 'Metal',    capSteps: null },
	{ name: 'AGI',        type: 'u', cat: 'Enhance Stats',     pot: 5,  baseCost: 25,   mat: 'Cloth',    capSteps: null },
	{ name: 'AGI %',      type: 'u', cat: 'Enhance Stats',     pot: 10, baseCost: 50,   mat: 'Cloth',    capSteps: null },
	{ name: 'DEX',        type: 'u', cat: 'Enhance Stats',     pot: 5,  baseCost: 25,   mat: 'Medicine', capSteps: null },
	{ name: 'DEX %',      type: 'u', cat: 'Enhance Stats',     pot: 10, baseCost: 50,   mat: 'Medicine', capSteps: null },
	// Enhance HP/MP
	{ name: 'Natural HP Regen',   type: 'd', cat: 'Enhance HP/MP', pot: 5,  baseCost: 25,   mat: 'Metal', capSteps: null },
	{ name: 'Natural HP Regen %', type: 'd', cat: 'Enhance HP/MP', pot: 10, baseCost: 50,   mat: 'Metal', capSteps: null },
	{ name: 'Natural MP Regen',   type: 'd', cat: 'Enhance HP/MP', pot: 10, baseCost: 50,   mat: 'Wood',  capSteps: null },
	{ name: 'Natural MP Regen %', type: 'd', cat: 'Enhance HP/MP', pot: 20, baseCost: 100,  mat: 'Wood',  capSteps: null },
	{ name: 'MaxHP',   type: 'u', cat: 'Enhance HP/MP', pot: 3,  baseCost: 16.5, mat: 'Metal', capSteps: null },
	{ name: 'MaxHP %', type: 'u', cat: 'Enhance HP/MP', pot: 10, baseCost: 50,   mat: 'Metal', capSteps: null },
	{ name: 'MaxMP',   type: 'u', cat: 'Enhance HP/MP', pot: 6,  baseCost: 33,   mat: 'Wood',  capSteps: 15 },
	// Enhance Attack
	{ name: 'ATK',              type: 'o', cat: 'Enhance Attack',   pot: 3,  baseCost: 16.5, mat: 'Beast',    capSteps: null },
	{ name: 'ATK %',            type: 'o', cat: 'Enhance Attack',   pot: 10, baseCost: 50,   mat: 'Beast',    capSteps: null },
	{ name: 'MATK',             type: 'o', cat: 'Enhance Attack',   pot: 3,  baseCost: 16.5, mat: 'Wood',     capSteps: null },
	{ name: 'MATK %',           type: 'o', cat: 'Enhance Attack',   pot: 10, baseCost: 50,   mat: 'Wood',     capSteps: null },
	{ name: 'Stability %',      type: 'u', cat: 'Enhance Attack',   pot: 20, baseCost: 100,  mat: 'Medicine', capSteps: null },
	{ name: 'Physical Pierce %',type: 'o', cat: 'Enhance Attack',   pot: 20, baseCost: 100,  mat: 'Beast',    capSteps: null },
	{ name: 'Magic Pierce %',   type: 'o', cat: 'Enhance Attack',   pot: 20, baseCost: 100,  mat: 'Wood',     capSteps: null },
	// Enhance Defense
	{ name: 'DEF',                        type: 'd', cat: 'Enhance Defense', pot: 3,  baseCost: 16.5, mat: 'Metal', capSteps: null },
	{ name: 'DEF %',                      type: 'd', cat: 'Enhance Defense', pot: 10, baseCost: 50,   mat: 'Metal', capSteps: null },
	{ name: 'MDEF',                       type: 'd', cat: 'Enhance Defense', pot: 3,  baseCost: 16.5, mat: 'Metal', capSteps: null },
	{ name: 'MDEF %',                     type: 'd', cat: 'Enhance Defense', pot: 10, baseCost: 50,   mat: 'Metal', capSteps: null },
	{ name: 'Physical Resistance %',      type: 'd', cat: 'Enhance Defense', pot: 10, baseCost: 50,   mat: 'Metal', capSteps: null },
	{ name: 'Magical Resistance %',       type: 'd', cat: 'Enhance Defense', pot: 10, baseCost: 50,   mat: 'Wood',  capSteps: null },
	{ name: 'Reduce Dmg (Player Epicenter) %', type: 'd', cat: 'Enhance Defense', pot: 6, baseCost: 15, mat: 'Metal', capSteps: 10, noNeg: true },
	{ name: 'Reduce Dmg (Foe Epicenter) %',    type: 'd', cat: 'Enhance Defense', pot: 6, baseCost: 15, mat: 'Beast', capSteps: 10, noNeg: true },
	{ name: 'Reduce Dmg (Straight Line) %',    type: 'd', cat: 'Enhance Defense', pot: 6, baseCost: 15, mat: 'Beast', capSteps: 10, noNeg: true },
	{ name: 'Reduce Dmg (Charge) %',           type: 'd', cat: 'Enhance Defense', pot: 6, baseCost: 15, mat: 'Beast', capSteps: 10, noNeg: true },
	{ name: 'Reduce Dmg (Floor) %',            type: 'd', cat: 'Enhance Defense', pot: 4, baseCost: 15, mat: 'Medicine', capSteps: 10, noNeg: true },
	{ name: 'Reduce Dmg (Bullet) %',           type: 'd', cat: 'Enhance Defense', pot: 4, baseCost: 15, mat: 'Wood',     capSteps: 10, noNeg: true },
	{ name: 'Reduce Dmg (Bowling) %',          type: 'd', cat: 'Enhance Defense', pot: 4, baseCost: 15, mat: 'Wood',     capSteps: 10, noNeg: true },
	{ name: 'Reduce Dmg (Meteor) %',           type: 'd', cat: 'Enhance Defense', pot: 4, baseCost: 15, mat: 'Medicine', capSteps: 10, noNeg: true },
	// Enhance Accuracy
	{ name: 'Accuracy',   type: 'o', cat: 'Enhance Accuracy', pot: 10, baseCost: 50,  mat: 'Medicine', capSteps: null },
	{ name: 'Accuracy %', type: 'o', cat: 'Enhance Accuracy', pot: 20, baseCost: 100, mat: 'Medicine', capSteps: null },
	// Enhance Dodge
	{ name: 'Dodge',   type: 'd', cat: 'Enhance Dodge', pot: 10, baseCost: 50,  mat: 'Cloth', capSteps: null },
	{ name: 'Dodge %', type: 'd', cat: 'Enhance Dodge', pot: 20, baseCost: 100, mat: 'Cloth', capSteps: null },
	// Enhance Speed
	{ name: 'ASPD',   type: 'u', cat: 'Enhance Speed', pot: 1, baseCost: 1,  mat: 'Cloth',    capSteps: null },
	{ name: 'ASPD %', type: 'u', cat: 'Enhance Speed', pot: 1, baseCost: 5,  mat: 'Cloth',    capSteps: null },
	{ name: 'CSPD',   type: 'u', cat: 'Enhance Speed', pot: 1, baseCost: 1,  mat: 'Medicine', capSteps: null },
	{ name: 'CSPD %', type: 'u', cat: 'Enhance Speed', pot: 1, baseCost: 5,  mat: 'Medicine', capSteps: null },
	// Enhance Critical
	{ name: 'Critical Rate',     type: 'u', cat: 'Enhance Critical', pot: 1,  baseCost: 5,    mat: 'Mana', capSteps: null },
	{ name: 'Critical Rate %',   type: 'u', cat: 'Enhance Critical', pot: 1,  baseCost: 5,    mat: 'Mana', capSteps: null },
	{ name: 'Critical Damage',   type: 'u', cat: 'Enhance Critical', pot: 3,  baseCost: 16.5, mat: 'Mana', capSteps: null },
	{ name: 'Critical Damage %', type: 'u', cat: 'Enhance Critical', pot: 10, baseCost: 50,   mat: 'Mana', capSteps: null },
	// Enhance Elements
	{ name: '% stronger against Fire',  type: 'o', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: '% stronger against Water', type: 'o', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: '% stronger against Wind',  type: 'o', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: '% stronger against Earth', type: 'o', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: '% stronger against Light', type: 'o', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: '% stronger against Dark',  type: 'o', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: 'Fire resistance %',   type: 'd', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: 'Water resistance %',  type: 'd', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: 'Wind resistance %',   type: 'd', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: 'Earth resistance %',  type: 'd', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: 'Light resistance %',  type: 'd', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	{ name: 'Dark resistance %',   type: 'd', cat: 'Enhance Elements', pot: 5, baseCost: 25, mat: 'Mana', capSteps: null },
	// Special Enhancement
	{ name: 'Ailment Resistance %', type: 'u', cat: 'Special Enhancement', pot: 20, baseCost: 100, mat: 'Mana', capSteps: null },
	{ name: 'Guard Power %',        type: 'u', cat: 'Special Enhancement', pot: 20, baseCost: 100, mat: 'Mana', capSteps: null },
	{ name: 'Guard Recharge %',     type: 'u', cat: 'Special Enhancement', pot: 20, baseCost: 100, mat: 'Mana', capSteps: null },
	{ name: 'Evasion Recharge %',   type: 'u', cat: 'Special Enhancement', pot: 20, baseCost: 100, mat: 'Mana', capSteps: null },
	{ name: 'Aggro %',              type: 'u', cat: 'Special Enhancement', pot: 6,  baseCost: 33,  mat: 'Mana', capSteps: 15 },
	// Awaken Elements
	{ name: 'Fire Element',   type: 'e', cat: 'Awaken Elements', pot: 100, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Water Element',  type: 'e', cat: 'Awaken Elements', pot: 100, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Wind Element',   type: 'e', cat: 'Awaken Elements', pot: 100, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Earth Element',  type: 'e', cat: 'Awaken Elements', pot: 100, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Light Element',  type: 'e', cat: 'Awaken Elements', pot: 100, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Dark Element',   type: 'e', cat: 'Awaken Elements', pot: 100, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	// Awaken Elements (matching)
	{ name: 'Fire Element (matching)',  type: 'e', cat: 'Awaken Elements', pot: 10, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Water Element (matching)', type: 'e', cat: 'Awaken Elements', pot: 10, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Wind Element (matching)',  type: 'e', cat: 'Awaken Elements', pot: 10, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Earth Element (matching)', type: 'e', cat: 'Awaken Elements', pot: 10, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Light Element (matching)', type: 'e', cat: 'Awaken Elements', pot: 10, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
	{ name: 'Dark Element (matching)',  type: 'e', cat: 'Awaken Elements', pot: 10, baseCost: 150, mat: 'Mana', capSteps: 1, noNeg: true },
];

export const CATEGORIES = [...new Set(STAT_DB.map(s => s.cat))];
export const CAP_STEPS = 20;
export const MAT_TYPES = ['Beast', 'Wood', 'Metal', 'Cloth', 'Medicine', 'Mana'];

export function getStatDef(name) {
	return STAT_DB.find(s => s.name === name) ?? null;
}

export function capOf(stat) {
	return stat.capSteps ?? CAP_STEPS;
}