import { itemTypes, typeCategory, categories } from '$lib/constant/item-types';
import { statKeys } from '$lib/constant/stat-keys';

/**
 * @typedef {import('$lib/data/items.json')} RawItem
 */

/*
 * ── Contoh penggunaan ──────────────────────────────────
 *
 *  import items from '$lib/data/items.json';
 *  import {
 *    adaptItem, adaptItems,
 *    getStatEntries, getExclusiveEntries,
 *    filterByCategory, searchItems,
 *    typeCategory, categories,
 *  } from '$lib/utils/item-adapter';
 *
 *  // 1) Adapt item tunggal
 *  const item = adaptItem(items[0]);
 *  item.name       // "Ancient Coin"
 *  item.category   // "material"  ← resolved dari typeCategory
 *  item.sellParsed // { value: 7, unit: "Spina" }
 *  item.hasStats   // false
 *  item.isCraftable // false
 *
 *  // 2) Adapt semua item
 *  const all = adaptItems(items);
 *
 *  // 3) Stat entries dengan label sudah di-resolve
 *  const stats = getStatEntries(item);
 *  // [{ label: "ATK", value: "2" }, { label: "MP", value: "10" }]
 *
 *  // 4) Exclusive entries (piercer)
 *  const excl = getExclusiveEntries(item);
 *  // [{ condition: "1-Handed Sword", stats: [{ label: "Adds 1 slot ...", value: "1" }] }]
 *
 *  // 5) Filter by category
 *  const weapons = filterByCategory(items, 'weapon');
 *
 *  // 6) Search by name (case-insensitive)
 *  const result = searchItems(items, 'ancient');
 */

/**
 * Parse a sell string like "7 Spina" → { value: 7, unit: "Spina" }
 * @param {string} sell
 * @returns {{ value: number, unit: string } | null}
 */
function parseSell(sell) {
	if (!sell || sell === 'Unknown' || sell === '0 Spina') return null;
	const m = sell.match(/^(\d+)\s+(.+)$/);
	return m ? { value: Number(m[1]), unit: m[2] } : null;
}

/**
 * Parse a process string like "7 Metal" → { value: 7, material: "Metal" }
 * @param {string} process
 * @returns {{ value: number, material: string } | null}
 */
function parseProcess(process) {
	if (!process || process === 'N/A' || process === 'unknown') return null;
	const m = process.match(/^(\d+)\s+(.+)$/);
	return m ? { value: Number(m[1]), material: m[2] } : null;
}

/**
 * Resolve stat display label from a stat key (camelCase or original label)
 * @param {string} key
 * @returns {string}
 */
function resolveStatLabel(key) {
	return statKeys[key] || key;
}

/**
 * Check if an item has general stats
 * @param {RawItem} item
 * @returns {boolean}
 */
function hasStats(item) {
	return item.stats && item.stats.general && Object.keys(item.stats.general).length > 0;
}

/**
 * Check if an item has exclusive (piercer) stats
 * @param {RawItem} item
 * @returns {boolean}
 */
function hasExclusiveStats(item) {
	return item.stats && item.stats.exclusive && item.stats.exclusive.length > 0;
}

/**
 * Check if an item is craftable
 * @param {RawItem} item
 * @returns {boolean}
 */
function isCraftable(item) {
	return item.recipe && Object.keys(item.recipe).length > 0;
}

/**
 * Check if an item has drops
 * @param {RawItem} item
 * @returns {boolean}
 */
function hasDrops(item) {
	return item.drops && item.drops.length > 0;
}

/**
 * Check if an item is used in crafting
 * @param {RawItem} item
 * @returns {boolean}
 */
function isUsedInCrafting(item) {
	return item.used_for && item.used_for.crafting && item.used_for.crafting.length > 0;
}

/**
 * Check if an item can be upgraded into something
 * @param {RawItem} item
 * @returns {boolean}
 */
function canUpgrade(item) {
	return item.used_for && item.used_for.upgrade_into && item.used_for.upgrade_into.length > 0;
}

/**
 * Adapted item with resolved/computed fields.
 * @typedef {Object} AdaptedItem
 * @property {string} name
 * @property {string} id
 * @property {string} url
 * @property {string} type - original type label
 * @property {string} category - resolved category (weapon/armor/etc)
 * @property {string | null} sell
 * @property {string | null} process
 * @property {{ value: number, unit: string } | null} sellParsed
 * @property {{ value: number, material: string } | null} processParsed
 * @property {Object} stats
 * @property {Array} drops
 * @property {Object} recipe
 * @property {Object} usedFor
 */

/**
 * Adapt a raw item object → normalized adapted item.
 *
 * Resolves category from type label, parses sell/process,
 * and makes stat keys available under a stable interface.
 *
 * @param {RawItem} item
 * @returns {AdaptedItem}
 */
export function adaptItem(item) {
	return {
		name: item.name,
		id: item.id,
		url: item.url,
		type: item.type,
		category: typeCategory[item.type] || 'other',
		sell: item.sell || null,
		process: item.process || null,
		sellParsed: parseSell(item.sell),
		processParsed: parseProcess(item.process),
		stats: {
			general: item.stats?.general || {},
			exclusive: item.stats?.exclusive || []
		},
		drops: item.drops || [],
		recipe: item.recipe || {},
		usedFor: item.used_for || { crafting: [], upgrade_into: [] },

		// computed booleans
		hasStats: hasStats(item),
		hasExclusiveStats: hasExclusiveStats(item),
		isCraftable: isCraftable(item),
		hasDrops: hasDrops(item),
		isUsedInCrafting: isUsedInCrafting(item),
		canUpgrade: canUpgrade(item)
	};
}

/**
 * Adapt an array of raw items.
 * @param {RawItem[]} items
 * @returns {AdaptedItem[]}
 */
export function adaptItems(items) {
	return items.map(adaptItem);
}

/**
 * Get general stats as an array of { label, value } entries.
 * @param {AdaptedItem | RawItem} item
 * @returns {Array<{ label: string, value: string }>}
 */
export function getStatEntries(item) {
	const general = item.stats?.general || {};
	return Object.entries(general).map(([key, value]) => ({
		label: resolveStatLabel(key),
		value
	}));
}

/**
 * Get exclusive (piercer) stats as resolved objects.
 * @param {AdaptedItem | RawItem} item
 * @returns {Array<{ condition: string, stats: Array<{ label: string, value: string }> }>}
 */
export function getExclusiveEntries(item) {
	const exclusive = item.stats?.exclusive || [];
	return exclusive.map((entry) => ({
		condition: entry.condition,
		stats: Object.entries(entry.stats).map(([key, value]) => ({
			label: resolveStatLabel(key),
			value
		}))
	}));
}

/**
 * Filter items by category (e.g. 'weapon', 'crysta', 'material').
 * @param {RawItem[]} items
 * @param {string} category
 * @returns {RawItem[]}
 */
export function filterByCategory(items, category) {
	return items.filter((item) => typeCategory[item.type] === category);
}

/**
 * Filter items by type label — gunakan `itemTypes` constant agar konsisten.
 *
 * @example
 * import items from '$lib/data/items.json';
 * import { itemTypes, filterByType } from '$lib/utils/item-adapter';
 *
 * const magicDevices = filterByType(items, itemTypes.magicDevice);
 * // → semua item bertipe "Magic Device"
 *
 * @param {RawItem[]} items
 * @param {string} typeLabel — pakai itemTypes.* (misal itemTypes.magicDevice)
 * @returns {RawItem[]}
 */
export function filterByType(items, typeLabel) {
	return items.filter((item) => item.type === typeLabel);
}

/**
 * Search items by name (case-insensitive).
 *
 * @example
 * import items from '$lib/data/items.json';
 * import { searchItems } from '$lib/utils/item-adapter';
 *
 * searchItems(items, 'ancient')
 * // → items where name includes "Ancient"
 *
 * @param {RawItem[]} items
 * @param {string} query
 * @returns {RawItem[]}
 */
export function searchItems(items, query) {
	const q = query.toLowerCase();
	return items.filter((item) => item.name.toLowerCase().includes(q));
}

/**
 * Filter items that have a specific stat in `stats.general`.
 * Gunakan `statKeys` constant untuk key-nya.
 *
 * @example
 * import items from '$lib/data/items.json';
 * import { statKeys, filterByStat } from '$lib/utils/item-adapter';
 *
 * const atkItems = filterByStat(items, statKeys.atk);
 * // → semua item yang punya stat "ATK" di general
 *
 * @param {RawItem[]} items
 * @param {string} statKey — pakai statKeys.* (misal statKeys.atk, statKeys.criticalRate)
 * @returns {RawItem[]}
 */
export function filterByStat(items, statKey) {
	return items.filter((item) => item.stats?.general && statKey in item.stats.general);
}

/**
 * Filter items that have a specific stat in `stats.exclusive[*].stats`.
 * Gunakan `statKeys` atau `exclusiveKeys` constant untuk key-nya.
 *
 * @example
 * import items from '$lib/data/items.json';
 * import { exclusiveKeys, filterByExclusiveStat } from '$lib/utils/item-adapter';
 *
 * const slotItems = filterByExclusiveStat(items, exclusiveKeys[0]);
 * // → semua item yang punya exclusive stat tersebut
 *
 * @param {RawItem[]} items
 * @param {string} statKey — pakai exclusiveKeys[*] atau statKeys.*
 * @returns {RawItem[]}
 */
export function filterByExclusiveStat(items, statKey) {
	return items.filter((item) => item.stats?.exclusive?.some((entry) => statKey in entry.stats));
}

/**
 * Build a name→item lookup from an array.
 * @param {RawItem[]} items
 * @returns {Map<string, RawItem>}
 */
function buildItemMap(items) {
	const map = new Map();
	for (const item of items) {
		map.set(item.name, item);
	}
	return map;
}

/**
 * Collect all names in an item's upgrade lineage (ancestors + descendants + self).
 * "ancestors" = items that eventually upgrade into this item.
 * "descendants" = items this item eventually upgrades into.
 * Walks `used_for.upgrade_into` recursively both upstream and downstream.
 *
 * @param {string} name
 * @param {Map<string, RawItem>} itemMap
 * @param {RawItem[]} allItems
 * @returns {Set<string>}
 */
function getUpgradeLineage(name, itemMap, allItems) {
	const lineage = new Set();

	function walkUp(n, visited = new Set()) {
		if (!n || visited.has(n)) return;
		visited.add(n);
		lineage.add(n);
		// find items that have n in their upgrade_into (i.e. n's predecessors)
		for (const item of allItems) {
			if (item.used_for?.upgrade_into?.includes(n)) {
				walkUp(item.name, visited);
			}
		}
	}

	function walkDown(n, visited = new Set()) {
		if (!n || visited.has(n)) return;
		visited.add(n);
		lineage.add(n);
		const item = itemMap.get(n);
		if (item?.used_for?.upgrade_into) {
			for (const next of item.used_for.upgrade_into) {
				walkDown(next, visited);
			}
		}
	}

	walkUp(name);
	walkDown(name);
	return lineage;
}

/**
 * Check if two items share the same upgrade path.
 *
 * Dalam 1 equipment tidak boleh memasang 2 crysta/item dengan
 * nama yang sama **atau** berasal dari path upgrade yang sama.
 * Misal A adalah upgrade dari B → true. B upgrade dari C → true.
 * Maka A & C juga true (nested — satu lineage).
 *
 * @param {RawItem} itemA
 * @param {RawItem} itemB
 * @param {RawItem[]} allItems — seluruh array items.json (untuk lookup nama)
 * @returns {boolean}
 *
 * @example
 * import items from '$lib/data/items.json';
 * import { isSameUpgradePath } from '$lib/utils/item-adapter';
 *
 * const a = items.find(i => i.name === 'Zega IX');
 * const b = items.find(i => i.name === 'Zega X');
 * isSameUpgradePath(a, b, items) // true → Zega X adalah upgrade dari Zega IX
 */
export function isSameUpgradePath(itemA, itemB, allItems) {
	if (itemA.name === itemB.name) return true;

	const itemMap = buildItemMap(allItems);
	const lineageA = getUpgradeLineage(itemA.name, itemMap, allItems);

	return lineageA.has(itemB.name);
}

export { itemTypes, typeCategory, categories, statKeys };
