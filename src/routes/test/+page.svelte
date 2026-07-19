<script>
	import { onMount } from 'svelte';
	import items from '$lib/data/items.json';
	import {
		adaptItem,
		adaptItems,
		filterByType,
		filterByCategory,
		filterByStat,
		getStatEntries,
		isSameUpgradePath,
		itemTypes,
		statKeys
	} from '$lib/utils/item-adapter';

	let logs = $state([]);

	function log(...args) {
		logs = [
			...logs,
			args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
		];
	}

	onMount(() => {
		log('=== adaptItem (first) ===');
		const first = adaptItem(items[0]);
		log('name:', first.name);
		log('category:', first.category);
		log('sellParsed:', JSON.stringify(first.sellParsed));
		log('processParsed:', JSON.stringify(first.processParsed));
		log('hasStats:', first.hasStats);
		log('isCraftable:', first.isCraftable);

		log('');
		log('=== filterByType (itemTypes.magicDevice) ===');
		const magicDevices = filterByType(items, itemTypes.magicDevice);
		log('count:', magicDevices.length);

		log('');
		log('=== filterByCategory (weapon) ===');
		const weapons = filterByCategory(items, 'weapon');
		log('count:', weapons.length, '| first:', weapons[0]?.name, weapons[0]?.type);

		log('');
		log('=== filterByStat (statKeys.atk) ===');
		const atkItems = filterByStat(items, statKeys.atk);
		log('count:', atkItems.length);
		if (atkItems.length) {
			const e = getStatEntries(atkItems[0]);
			log('sample:', atkItems[0].name, '→', JSON.stringify(e));
		}

		log('');
		log('=== category distribution ===');
		const all = adaptItems(items);
		const cats = [...new Set(all.map((i) => i.category))].sort();
		for (const c of cats) {
			const n = all.filter((i) => i.category === c).length;
			log(`  ${c}: ${n}`);
		}

		log('');
		log('=== isSameUpgradePath ===');
		const zega9 = items.find((i) => i.name === 'Zega IX');
		const zega10 = items.find((i) => i.name === 'Zega X');
		const zega1 = items.find((i) => i.name === 'Zega');
		if (zega9 && zega10) {
			log('Zega IX vs Zega X:', isSameUpgradePath(zega9, zega10, items)); // true
			log('Zega IX vs Ancient Coin:', isSameUpgradePath(zega9, items[0], items)); // false
		}
		if (zega1 && zega10) {
			log('Zega (I) vs Zega X (nested):', isSameUpgradePath(zega1, zega10, items)); // true
		}

		log('');
		log('✅ OK');
	});
</script>

<div>
	{#each logs as l, i (i)}
		<p style="margin:0; font-family:monospace; font-size:12px">{l}</p>
	{/each}
</div>
