/** @type {Record<string, string>} registry: camelCase → original label */
export const itemTypes = {
	oneHandedSword: '1 Handed Sword',
	twoHandedSword: '2 Handed Sword',
	additional: 'Additional',
	additionalCrysta: 'Additional Crysta',
	armor: 'Armor',
	armorCrysta: 'Armor Crysta',
	arrow: 'Arrow',
	bow: 'Bow',
	bowgun: 'Bowgun',
	dagger: 'Dagger',
	enhancerCrystaBlue: 'Enhancer Crysta (Blue)',
	enhancerCrystaGreen: 'Enhancer Crysta (Green)',
	enhancerCrystaPurple: 'Enhancer Crysta (Purple)',
	enhancerCrystaRed: 'Enhancer Crysta (Red)',
	enhancerCrystaYellow: 'Enhancer Crysta (Yellow)',
	gem: 'Gem',
	halberd: 'Halberd',
	katana: 'Katana',
	knuckles: 'Knuckles',
	magicDevice: 'Magic Device',
	material: 'Material',
	ninjutsuScroll: 'Ninjutsu Scroll',
	normalCrysta: 'Normal Crysta',
	ore: 'Ore',
	piercer: 'Piercer',
	refinementSupport: 'Refinement Support',
	registlet: 'Registlet',
	shield: 'Shield',
	special: 'Special',
	specialCrysta: 'Special Crysta',
	staff: 'Staff',
	unknown: 'Unknown',
	usable: 'Usable',
	weaponCrysta: 'Weapon Crysta'
};

/** @type {string[]} all original type labels */
export const allTypes = Object.values(itemTypes);

/** @type {string[]} all camelCase keys */
export const allTypeKeys = Object.keys(itemTypes);

/** kategori lookup per key */
const keyToCategory = {
	// weapon
	oneHandedSword: 'weapon',
	twoHandedSword: 'weapon',
	bow: 'weapon',
	bowgun: 'weapon',
	staff: 'weapon',
	magicDevice: 'weapon',
	knuckles: 'weapon',
	halberd: 'weapon',
	katana: 'weapon',
	arrow: 'weapon',
	// armor
	armor: 'armor',
	// subWeapon
	shield: 'subWeapon',
	ninjutsuScroll: 'subWeapon',
	dagger: 'subWeapon',
	// additional
	additional: 'additional',
	// special
	special: 'special',
	// crysta
	normalCrysta: 'crysta',
	weaponCrysta: 'crysta',
	armorCrysta: 'crysta',
	additionalCrysta: 'crysta',
	specialCrysta: 'crysta',
	enhancerCrystaBlue: 'crysta',
	enhancerCrystaGreen: 'crysta',
	enhancerCrystaPurple: 'crysta',
	enhancerCrystaRed: 'crysta',
	enhancerCrystaYellow: 'crysta',
	// material
	material: 'material',
	ore: 'material',
	gem: 'material',
	// consumable
	usable: 'consumable',
	refinementSupport: 'consumable',
	piercer: 'consumable',
	registlet: 'consumable',
	// other
	unknown: 'other'
};

/** @type {Record<string, string>} map: original label → category */
export const typeCategory = {};
for (const [key, label] of Object.entries(itemTypes)) {
	typeCategory[label] = keyToCategory[key];
}

/** @type {string[]} */
export const categories = [
	'weapon',
	'armor',
	'subWeapon',
	'additional',
	'special',
	'crysta',
	'material',
	'consumable',
	'other'
];

/** @type {Record<string, string[]>} category → array of original labels */
export const categoryTypes = {};
for (const label of allTypes) {
	const cat = typeCategory[label];
	if (!categoryTypes[cat]) categoryTypes[cat] = [];
	categoryTypes[cat].push(label);
}
for (const cat of Object.keys(categoryTypes)) {
	categoryTypes[cat].sort();
}
