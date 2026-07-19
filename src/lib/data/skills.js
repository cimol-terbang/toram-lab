/**
 * @file Data: Skill definitions for damage calculator
 * 
 * Each skill tree contains an array of skill definitions.
 * 
 * Skill Structure:
 * @typedef {Object} SkillDef
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} tree - Skill tree category (blade, shot, magic, etc.)
 * @property {number} tier - Skill tier (1-5)
 * @property {number} maxLevel - Max skill level (default 10)
 * @property {number} mpCost - Base MP cost
 * @property {string} range - 'short' | 'long' | 'none'
 * @property {string[]} weaponTypes - Allowed weapon types
 * @property {string} [prorationType] - 'physical' (default) | 'magic'
 * @property {Object[]} [hits] - Array of hit definitions for multi-stage/multi-hit skills
 * @property {Object[]} [modifiers] - Dynamic UI modifiers
 * @property {Object[]} [resources] - Resource/stacks system
 * @property {Object[]} [buffs] - Buff effects to other skills
 * @property {function} calcParams - (ctx) => { mult, const, pierce?, mpCost?, rangeType?, extra? }
 */

/** Context passed to calcParams */
/**
 * @typedef {Object} SkillCalcCtx
 * @property {number} level - Skill level (1-10)
 * @property {string} weaponType - Weapon type key
 * @property {Object} stats - Computed character stats (from computeStats)
 * @property {Object} baseStats - Raw base stats (str, dex, int, etc.)
 * @property {Object<string, any>} modifierValues - Current values of dynamic modifiers
 * @property {Object<string, number>} resources - Current resource/stack values
 */

/** @type {Record<string, SkillDef[]>} */
export const skills = {
	blade: [
		// ── T3 Skills ──────────────────────────────────────────────
		{
			id: 'swordTempest',
			name: 'Sword Tempest',
			tree: 'blade',
			tier: 3,
			maxLevel: 10,
			mpCost: 400,
			range: 'long',
			weaponTypes: ['oneHandedSword', 'twoHandedSword'],
			prorationType: 'magic',
			hits: [
				{
					id: 'wave',
					label: 'Wave (First Hit)',
					calcParams: (ctx) => {
						const lv = ctx.level;
						let mult = 1.5 + 0.1 * lv;
						if (ctx.weaponType === 'twoHandedSword') {
							mult += 1 + (ctx.baseStats?.str ?? 0) / 500;
						}
						return {
							mult: mult * 100,
							const: 0,
							pierce: 0,
							rangeType: 'long'
						};
					}
				},
				{
					id: 'tornado',
					label: 'Tornado (Per Tick)',
					calcParams: (ctx) => {
						const lv = ctx.level;
						const is1H = ctx.weaponType === 'oneHandedSword';
						let mult = 0.5 + 0.05 * lv;
						if (is1H) {
							mult += (ctx.baseStats?.dex ?? 0) / 500;
						}
						return {
							mult: mult * 100,
							const: 80,
							pierce: 0,
							rangeType: 'none',
							hitCount: lv <= 2 ? 2 : lv <= 4 ? 3 : lv <= 6 ? 4 : lv <= 8 ? 5 : 6
						};
					}
				}
			],
			modifiers: [
				{
					id: 'waveRangeBonus',
					label: 'Wave affected by range dmg',
					type: 'checkbox',
					defaultValue: true
				}
			]
		},

		// ── T4 Skills ──────────────────────────────────────────────
		{
			id: 'auraBlade',
			name: 'Aura Blade',
			tree: 'blade',
			tier: 4,
			maxLevel: 10,
			mpCost: 200,
			range: 'long',
			weaponTypes: ['oneHandedSword', 'twoHandedSword'],
			hits: [
				{
					id: 'hit',
					label: 'Damage Hit',
					calcParams: (ctx) => {
						const lv = ctx.level;
						const is1H = ctx.weaponType === 'oneHandedSword';
						const hitCount = is1H ? 2 : 1;
						const totalMult = (5 + lv) * 100;
						const totalConst = 200;
						return {
							mult: totalMult,
							const: totalConst / hitCount,
							pierce: 0,
							hitCount,
							splitDamage: true,
							aoeRadius: 3.5
						};
					}
				}
			],
			modifiers: [
				{
					id: 'additionalMelee',
					label: 'Additional Melee% Gained',
					type: 'number',
					min: 0,
					max: 100,
					defaultValue: 0,
					tooltip: '(10 × Skill Level)%, THS gets 50%'
				}
			],
			buffs: [
				{ target: 'busterBlade', effect: 'multBonus', formula: (ctx) => 0.2 * ctx.level + (ctx.baseStats?.dex ?? 0) / 200 },
				{ target: 'nextSkill', effect: 'finalMultiplier', value: (ctx) => ctx.weaponType === 'twoHandedSword' ? 1.3 : 1.2 }
			]
		},

		// ── T5 Skills ──────────────────────────────────────────────
		{
			id: 'ogreSlash',
			name: 'Ogre Slash',
			tree: 'blade',
			tier: 5,
			maxLevel: 10,
			mpCost: 500,
			range: 'short',
			weaponTypes: ['twoHandedSword'],
			modifiers: [
				{
					id: 'ogreStacksConsumed',
					label: 'Ogre Stacks Consumed',
					type: 'range',
					min: 1,
					max: 10,
					defaultValue: 10
				}
			],
		hits: [
			{
				id: 'firstHit',
				label: 'First Hit (Single Target)',
				calcParams: (ctx) => {
					const stacks = ctx.modifierValues?.ogreStacksConsumed ?? 10;
					const basePierce = 10 * stacks;
					const pierce = Math.min(100, basePierce);
					// Exceed pierce → bonus multiplier added to First Hit
					// every 1% excess = +0.01 to raw multiplier (additive)
					const overflowPierce = Math.max(0, basePierce - 100);
					const overflowBonus = overflowPierce * 0.01; // e.g. 20% overflow → +0.20
					// Base raw multiplier = (Base STR + Base VIT) / 100
					const baseRawMult = ((ctx.baseStats?.str ?? 0) + (ctx.baseStats?.vit ?? 0)) / 100;
					// Total raw mult = baseRawMult + overflowBonus, then convert to %
					const totalMult = (baseRawMult + overflowBonus) * 100;
					return {
						mult: totalMult,
						const: ctx.stats?.totalDex ?? 0,
						pierce,
					};
				}
			},
			{
				id: 'secondHit',
				label: 'Second Hit (AOE)',
				calcParams: (ctx) => {
					const stacks = ctx.modifierValues?.ogreStacksConsumed ?? 10;
					const basePierce = 10 * stacks;
					const pierce = Math.min(100, basePierce);
					// Base multiplier = 2 * stacks (raw mult: 20 at 10 stacks = ×20 = 2000%)
					return {
						mult: (2 * stacks) * 100,
						const: 500,
						pierce,
						rangeType: 'short', // affected by SRD%
						isAoe: true,
						aoeRadius: 1.5,
						bypassGuard: true,
						delayMs: 2500
					};
				}
			}
		],
			buffs: [
				{ target: 'rampage', effect: 'doubleDamage' },
				{ target: 'berserk', effect: 'mitigateStabilityPenalty', value: 0.5 },
				{ target: 'berserk', effect: 'mitigateDefPenalty', value: 0.5 }
			]
		}
	],

	// ── Placeholder for future trees ─────────────────────────────
	shot: [],
	magic: [],
	martial: [],
	guard: [],
	halberdSkills: [],
	katana: [],
	dualSwords: []
};

/**
 * Get a skill definition by tree + id
 * @param {string} tree
 * @param {string} id
 * @returns {SkillDef|undefined}
 */
export function getSkill(tree, id) {
	return (skills[tree] ?? []).find((s) => s.id === id);
}

/**
 * Get all available skill trees
 * @returns {string[]}
 */
export function getSkillTrees() {
	return Object.keys(skills);
}

/**
 * Resolve skill parameters for all hits of a skill
 * @param {SkillDef} skillDef
 * @param {SkillCalcCtx} ctx
 * @returns {Array<{ mult: number, const: number, pierce: number, mpCost?: number, rangeType?: string, hitCount?: number, splitDamage?: boolean, [key: string]: any }>}
 */
export function resolveSkillHits(skillDef, ctx) {
	// If skill has explicit hits array, resolve each hit
	if (skillDef.hits && skillDef.hits.length > 0) {
		return skillDef.hits.map((hit) => {
			const result = hit.calcParams(ctx);
			return {
				id: hit.id,
				label: hit.label,
				mpCost: skillDef.mpCost,
				rangeType: result.rangeType ?? skillDef.range,
				hitCount: result.hitCount ?? 1,
				splitDamage: result.splitDamage ?? false,
				...result
			};
		});
	}

	// Simple single-hit skill
	if (skillDef.calcParams) {
		const result = skillDef.calcParams(ctx);
		return [
			{
				id: 'hit',
				label: 'Damage',
				mpCost: skillDef.mpCost,
				rangeType: result.rangeType ?? skillDef.range,
				hitCount: 1,
				splitDamage: false,
				...result
			}
		];
	}

	return [];
}

/**
 * Get modifier default values
 * @param {SkillDef} skillDef
 * @returns {Record<string, any>}
 */
export function getModifierDefaults(skillDef) {
	if (!skillDef.modifiers) return {};
	const defaults = {};
	for (const mod of skillDef.modifiers) {
		defaults[mod.id] = mod.defaultValue;
	}
	return defaults;
}