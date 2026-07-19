import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const here = (p) => resolve(__dirname, p);

// Load raw items via createRequire (simpler for JSON)
const require = createRequire(import.meta.url);
const items = require(here('src/lib/data/items.json'));

// Patch $lib → relative paths so Node can resolve without SvelteKit bundler
const adapterSrc = readFileSync(here('src/lib/utils/item-adapter.js'), 'utf-8');
const itemTypesSrc = readFileSync(here('src/lib/constant/item-types.js'), 'utf-8');
const statKeysSrc = readFileSync(here('src/lib/constant/stat-keys.js'), 'utf-8');

const adapterFixed = adapterSrc
	.replace(/\$lib\/constant\/item-types/g, '../../constant/item-types')
	.replace(/\$lib\/constant\/stat-keys/g, '../../constant/stat-keys');

// Write patched copies into __test_tmp
const tmp = here('__test_tmp');
mkdirSync(tmp, { recursive: true });
writeFileSync(resolve(tmp, 'adapter.mjs'), adapterFixed);
writeFileSync(resolve(tmp, 'item-types.mjs'), itemTypesSrc);
writeFileSync(resolve(tmp, 'stat-keys.mjs'), statKeysSrc);

// Import from tmp
const { itemTypes } = await import(pathToFileURL(resolve(tmp, 'item-types.mjs')));
const { statKeys } = await import(pathToFileURL(resolve(tmp, 'stat-keys.mjs')));
const adapter = await import(pathToFileURL(resolve(tmp, 'adapter.mjs')));

console.log('\n=== Test 1: adaptItem (first) ===');
const first = adapter.adaptItem(items[0]);
console.log('name:', first.name);
console.log('category:', first.category);
console.log('sellParsed:', JSON.stringify(first.sellParsed));
console.log('processParsed:', JSON.stringify(first.processParsed));
console.log('hasStats:', first.hasStats);
console.log('isCraftable:', first.isCraftable);

console.log('\n=== Test 2: filterByType (itemTypes.magicDevice) ===');
const magicDevices = adapter.filterByType(items, itemTypes.magicDevice);
console.log(
	'count:',
	magicDevices.length,
	'| items:',
	magicDevices
		.slice(0, 3)
		.map((i) => i.name)
		.join(', ')
);

console.log('\n=== Test 3: filterByCategory (weapon) ===');
const weapons = adapter.filterByCategory(items, 'weapon');
console.log('count:', weapons.length);
if (weapons.length) console.log('first:', weapons[0].name, '-', weapons[0].type);

console.log('\n=== Test 4: filterByStat (statKeys.atk) ===');
const atkItems = adapter.filterByStat(items, statKeys.atk);
console.log('count:', atkItems.length);
if (atkItems.length) {
	const entries = adapter.getStatEntries(atkItems[0]);
	console.log(
		'sample:',
		atkItems[0].name,
		'→',
		entries.filter((e) => e.label === 'ATK').map((e) => e.value)
	);
}

console.log('\n=== Test 5: adaptItems + category distribution ===');
const all = adapter.adaptItems(items);
console.log('total:', all.length);
console.log('with stats:', all.filter((i) => i.hasStats).length);
console.log('craftable:', all.filter((i) => i.isCraftable).length);
console.log('has drops:', all.filter((i) => i.hasDrops).length);

const cats = [...new Set(all.map((i) => i.category))].sort();
for (const c of cats) {
	const n = all.filter((i) => i.category === c).length;
	console.log(`  ${c}: ${n}`);
}

console.log('\n✅ All good.');
