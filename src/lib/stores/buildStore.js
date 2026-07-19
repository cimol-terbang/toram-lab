/**
 * Global Build Store
 * Single source of truth for current active build.
 * Auto-syncs to localStorage. All pages read/write from here.
 */

import { writable, derived, get } from 'svelte/store';

const LS_ACTIVE = 'toram_active_build_v1';
const LS_SLOTS = 'toram_build_slots_v1';
const MAX_SLOTS = 10;

// ─── Default state ────────────────────────────────────────────────────────────

function defaultStat() {
	return {
		level: 275,
		// main stats
		str: 0,
		dex: 0,
		int: 0,
		vit: 0,
		agi: 0,
		// personal stat (only one active)
		personalType: 'crt', // 'crt' | 'luk' | 'mtl' | 'tec'
		personalValue: 0
	};
}

function defaultEquipment() {
	return {
		weapon: { item: null, refine: 0, crysta: [null, null] },
		subWeapon: { item: null, refine: 0, crysta: [] },
		armor: { item: null, refine: 0, crysta: [null, null] },
		additional: { item: null, refine: 0, crysta: [null, null] },
		special: { item: null, refine: 0, crysta: [null, null] }
	};
}

export function defaultActiveBuild() {
	return {
		stat: defaultStat(),
		equipment: defaultEquipment()
	};
}

// ─── Slots default ────────────────────────────────────────────────────────────

function defaultSlots() {
	return Array.from({ length: MAX_SLOTS }, (_, i) => ({
		id: i,
		name: null, // null = empty slot
		snapshot: null
	}));
}

// ─── Load from localStorage ───────────────────────────────────────────────────

function loadActive() {
	try {
		const raw = localStorage.getItem(LS_ACTIVE);
		if (raw) {
			const parsed = JSON.parse(raw);
			// merge with defaults to handle schema changes
			return {
				stat: { ...defaultStat(), ...(parsed.stat ?? {}) },
				equipment: { ...defaultEquipment(), ...(parsed.equipment ?? {}) }
			};
		}
	} catch {}
	return defaultActiveBuild();
}

function loadSlots() {
	try {
		const raw = localStorage.getItem(LS_SLOTS);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return Array.from(
					{ length: MAX_SLOTS },
					(_, i) => parsed[i] ?? { id: i, name: null, snapshot: null }
				);
			}
		}
	} catch {}
	return defaultSlots();
}

// ─── Stores ───────────────────────────────────────────────────────────────────

// Only init from localStorage on the client
const isBrowser = typeof localStorage !== 'undefined';

export const activeBuild = writable(isBrowser ? loadActive() : defaultActiveBuild());
export const buildSlots = writable(isBrowser ? loadSlots() : defaultSlots());

// Auto-save active build whenever it changes
activeBuild.subscribe((val) => {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(LS_ACTIVE, JSON.stringify(val));
	} catch {}
});

// Auto-save slots whenever they change
buildSlots.subscribe((val) => {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(LS_SLOTS, JSON.stringify(val));
	} catch {}
});

// ─── Helpers: Stat ────────────────────────────────────────────────────────────

export function setStat(field, value) {
	activeBuild.update((b) => ({
		...b,
		stat: { ...b.stat, [field]: value }
	}));
}

// ─── Helpers: Equipment ───────────────────────────────────────────────────────

export function setEquipItem(slotId, item) {
	activeBuild.update((b) => ({
		...b,
		equipment: {
			...b.equipment,
			[slotId]: { ...b.equipment[slotId], item }
		}
	}));
}

export function setEquipRefine(slotId, refine) {
	activeBuild.update((b) => ({
		...b,
		equipment: {
			...b.equipment,
			[slotId]: { ...b.equipment[slotId], refine }
		}
	}));
}

export function setEquipCrysta(slotId, crystaIndex, crysta) {
	activeBuild.update((b) => {
		const slot = b.equipment[slotId];
		const newCrysta = [...slot.crysta];
		newCrysta[crystaIndex] = crysta;
		return {
			...b,
			equipment: {
				...b.equipment,
				[slotId]: { ...slot, crysta: newCrysta }
			}
		};
	});
}

export function clearEquipSlot(slotId) {
	activeBuild.update((b) => ({
		...b,
		equipment: {
			...b.equipment,
			[slotId]: {
				...b.equipment[slotId],
				item: null,
				refine: 0,
				crysta: b.equipment[slotId].crysta.map(() => null)
			}
		}
	}));
}

export function clearEquipCrysta(slotId, crystaIndex) {
	setEquipCrysta(slotId, crystaIndex, null);
}

// ─── Helpers: Build Slots ─────────────────────────────────────────────────────

export function saveBuildToSlot(slotIndex, name) {
	const snapshot = get(activeBuild);
	buildSlots.update((slots) => {
		const updated = [...slots];
		updated[slotIndex] = {
			id: slotIndex,
			name: name || `Build ${slotIndex + 1}`,
			snapshot: JSON.parse(JSON.stringify(snapshot)), // deep clone
			savedAt: Date.now()
		};
		return updated;
	});
}

export function loadBuildFromSlot(slotIndex) {
	const slots = get(buildSlots);
	const slot = slots[slotIndex];
	if (!slot?.snapshot) return;
	activeBuild.set(JSON.parse(JSON.stringify(slot.snapshot)));
}

export function renameBuildSlot(slotIndex, name) {
	buildSlots.update((slots) => {
		const updated = [...slots];
		if (updated[slotIndex]) updated[slotIndex] = { ...updated[slotIndex], name };
		return updated;
	});
}

export function deleteBuildSlot(slotIndex) {
	buildSlots.update((slots) => {
		const updated = [...slots];
		updated[slotIndex] = { id: slotIndex, name: null, snapshot: null };
		return updated;
	});
}
