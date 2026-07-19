/**
 * Lazy-load a JSON file from /data/ path.
 * Uses dynamic import (Virtual Module convention) + caching.
 * Falls back to fetch() for raw JSON files.
 *
 * @param {string} path - e.g. 'items' → loads /src/lib/data/items.json
 * @returns {Promise<object>}
 */
const cache = new Map();

export async function loadJson(name) {
	if (cache.has(name)) return cache.get(name);

	try {
		// Try dynamic import (works if data files export default)
		const mod = await import(`$lib/data/${name}.json`);
		const data = mod.default || mod;
		cache.set(name, data);
		return data;
	} catch {
		// Fallback: fetch from static/ or public path
		const res = await fetch(`/data/${name}.json`);
		if (!res.ok) throw new Error(`Failed to load ${name}.json`);
		const data = await res.json();
		cache.set(name, data);
		return data;
	}
}

/**
 * Clear entire lazy cache.
 */
export function clearJsonCache() {
	cache.clear();
}
