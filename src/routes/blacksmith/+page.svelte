<script>
	import { untrack } from 'svelte';
	import { Modal, PixelButton, StarsBg } from '$lib/components';
	import { Hammer, Trash2, Info, ChevronDown, ChevronUp, Plus } from '@lucide/svelte';

	import { STAT_DB, CATEGORIES, CAP_STEPS, MAT_TYPES, getStatDef, capOf } from '$lib/constant/custom-stats.js';

	// ─── CORE FORMULAS ───────────────────────────────────────────

	// Total pot cost to go from step 0 → absSteps (positive direction)
	// Steps 1..cap cost stat.pot each; steps cap+1.. cost stat.pot*2 each
	// absSteps is absolute (always >= 0)
	function potCostForSteps(stat, absSteps) {
		const cap = capOf(stat);
		let total = 0;
		for (let i = 1; i <= absSteps; i++) {
			total += i <= cap ? stat.pot : stat.pot * 2;
		}
		return total;
	}

	// Pot RETURNED when going negative (TEC-based, halved after cap)
	// returnRate = (5 + TEC/10) / 100
	function potReturnForSteps(stat, absSteps, tec) {
		const cap = capOf(stat);
		const rate = (5 + tec / 10) / 100;
		let total = 0;
		for (let i = 1; i <= absSteps; i++) {
			const posCost = i <= cap ? stat.pot : stat.pot * 2;
			// after cap, negative return is halved relative to full rate
			const retRate = i <= cap ? rate : rate / 2;
			total += posCost * retRate;
		}
		return total;
	}

	// Net pot change for a slot going from currentSteps → targetSteps
	// Returns negative number = pot consumed, positive = pot returned
	function potDeltaForSlot(stat, fromSteps, toSteps, gearType, tec) {
		if (fromSteps === toSteps) return 0;
		// Effective pot cost multiplier: offensive on armor = 2x, defensive on weapon = 2x
		const typeMul = (stat.type === 'o' && gearType === 'armor') ||
		                (stat.type === 'd' && gearType === 'weapon') ? 2 : 1;

		const absFrom = Math.abs(fromSteps);
		const absTo   = Math.abs(toSteps);

		if (toSteps >= 0) {
			// Positive: consumes pot
			const cost = potCostForSteps(stat, absTo) - potCostForSteps(stat, absFrom);
			return -cost * typeMul;
		} else {
			// Negative: returns pot
			const ret = potReturnForSteps(stat, absTo, tec) - potReturnForSteps(stat, absFrom, tec);
			return ret * typeMul;
		}
	}

	// Total mat cost to move from step fromSteps → toSteps
	// Cost per step N = baseCost × N²  (uses |N|)
	// Proficiency reduces total by reduction%
	function matCostForMove(stat, fromSteps, toSteps, proficiency) {
		if (fromSteps === toSteps) return 0;
		const dir = toSteps > fromSteps ? 1 : -1;
		let total = 0;
		for (let n = fromSteps + dir; n !== toSteps + dir; n += dir) {
			total += stat.baseCost * (Math.abs(n) ** 2);
		}
		const reduction = Math.floor(proficiency / 10) + Math.floor(proficiency / 50);
		return Math.ceil(total * (1 - reduction / 100));
	}

	// Penalty multiplier from same-category slots
	// N slots in same cat → 5%×N² additive penalty
	function calcPenaltyMul(slots) {
		const cats = {};
		for (const s of slots) {
			if (s.stat) cats[s.stat.cat] = (cats[s.stat.cat] ?? 0) + 1;
		}
		let penalty = 0;
		for (const n of Object.values(cats)) {
			if (n > 1) penalty += 0.05 * n * n;
		}
		return 1 + penalty;
	}

	// Success rate: 160 + (230 × finalPot) / max(prevPot, recipePot)
	// Clamped 0–100
	function calcSuccessRate(prevPot, finalPot) {
		if (prevPot <= 0) return 0;
		return Math.max(0, Math.min(100, 160 + (230 * finalPot) / prevPot));
	}

	// ─── APP STATE ───────────────────────────────────────────────

	const MAX_SLOTS = 8;

	function makeSlot(id) {
		return {
			id,
			statName: '',  // selected stat name
			stat: null,    // stat def object
			steps: 0,      // current confirmed steps
			targetSteps: 0 // desired steps (being edited)
		};
	}

	let gearType    = $state('weapon');
	let startingPot = $state(100);
	let tec         = $state(255);
	let proficiency = $state(0);
	let compassion  = $state(true);
	let anvil       = $state(true);

	// ─── FORMULA MANAGEMENT ──────────────────────────────────────
	const FORMULA_KEY = 'toram-blacksmith-formulas';
	let formulaList = $state([]);
	let activeFormulaId = $state(null);
	let editingFormulaName = $state(false);
	let renameBuffer = $state('');
	let _initLoaded = $state(false);

	let slots = $state(Array.from({ length: MAX_SLOTS }, (_, i) => makeSlot(i)));
	let history = $state([]); // confirmed steps
	let currentPot = $state(100); // tracks pot after each confirm

	let showHelp = $state(false);
	let showStatPicker = $state(false);
	let pickingSlotIndex = $state(-1);
	let statSearch = $state('');

	function openStatPicker(idx) {
		pickingSlotIndex = idx;
		statSearch = '';
		showStatPicker = true;
	}

	function pickStat(name) {
		if (pickingSlotIndex >= 0 && pickingSlotIndex < slots.length) {
			onStatChange(pickingSlotIndex, name);
		}
		showStatPicker = false;
		pickingSlotIndex = -1;
	}

	// ─── DERIVED PREVIEW ─────────────────────────────────────────

	// For each slot: pending delta = targetSteps - steps
	// Only slots with a stat AND a pending change contribute
	let pendingSlots = $derived(
		slots.filter(s => s.stat && s.targetSteps !== s.steps)
	);

	// Compassion (-10%) and Anvil (-40%) are separate multipliers
	let matModifier = $derived(
		(compassion ? 0.9 : 1) * (anvil ? 0.6 : 1)
	);

	// Per-slot mat costs (pending move only) with modifiers applied
	let slotMatCosts = $derived(
		slots.map(s => {
			if (!s.stat || s.targetSteps === s.steps) return 0;
			return Math.ceil(matCostForMove(s.stat, s.steps, s.targetSteps, proficiency) * matModifier);
		})
	);

	// Mat costs grouped by material type (pending step only)
	let pendingMats = $derived(() => {
		const m = Object.fromEntries(MAT_TYPES.map(t => [t, 0]));
		slots.forEach((s, i) => {
			if (s.stat && slotMatCosts[i] > 0) m[s.stat.mat] += slotMatCosts[i];
		});
		return m;
	});

	// Penalty multiplier for current slot configuration
	let penaltyMul = $derived(calcPenaltyMul(slots));

	// Total pending pot delta (with penalty applied to the raw delta)
	let pendingPotDelta = $derived(() => {
		let rawDelta = 0;
		for (const s of slots) {
			if (!s.stat || s.targetSteps === s.steps) continue;
			rawDelta += potDeltaForSlot(s.stat, s.steps, s.targetSteps, gearType, tec);
		}
		// Penalty only applies to consumption (negative deltas)
		// Positive delta (negatives stat, returns pot) is not penalized
		let penalized = 0;
		for (const s of slots) {
			if (!s.stat || s.targetSteps === s.steps) continue;
			const d = potDeltaForSlot(s.stat, s.steps, s.targetSteps, gearType, tec);
			if (d < 0) penalized += d * penaltyMul;
			else penalized += d;
		}
		return Math.round(penalized);
	});

	let futurePot = $derived(currentPot + pendingPotDelta());

	let successRate = $derived(
		calcSuccessRate(currentPot, futurePot)
	);

	// Total mats used across all history
	let totalMats = $derived(() => {
		const m = Object.fromEntries(MAT_TYPES.map(t => [t, 0]));
		for (const h of history) {
			for (const [t, v] of Object.entries(h.mats)) m[t] += v;
		}
		return m;
	});

	// ─── HANDLERS ────────────────────────────────────────────────

	function onStatChange(idx, name) {
		const def = getStatDef(name);
		slots[idx].statName = name;
		slots[idx].stat = def;
		slots[idx].steps = 0;
		slots[idx].targetSteps = 0;
	}

	function onTargetChange(idx, val) {
		const s = slots[idx];
		if (!s.stat) return;
		let n = parseInt(val) || 0;
		const cap = capOf(s.stat);
		// Clamp: noNeg → min 0; cap is based on CAP_STEPS (20 default)
		const minS = s.stat.noNeg ? 0 : -cap;
		const maxS = cap + 10; // allow bonus steps (up to cap+10 for the doubled-pot zone)
		n = Math.max(minS, Math.min(maxS, n));
		slots[idx].targetSteps = n;
	}

	function confirmStep() {
		if (pendingSlots.length === 0) return;
		if (futurePot < 1 && !isLastStep()) return;

		// Snapshot everything BEFORE any mutation
		const snapshot = pendingSlots.map(s => ({
			id: s.id,
			statName: s.statName,
			from: s.steps,
			to: s.targetSteps,
			delta: s.targetSteps - s.steps
		}));
		const stepMats = Object.fromEntries(MAT_TYPES.map(t => [t, 0]));
		slots.forEach((s, i) => {
			if (s.stat && slotMatCosts[i] > 0) stepMats[s.stat.mat] += slotMatCosts[i];
		});
		const potAfter = futurePot;
		const potBefore = currentPot;
		const rate = Math.round(successRate * 10) / 10;

		// Now mutate
		for (const snap of snapshot) {
			const slot = slots.find(x => x.id === snap.id);
			if (slot) slot.steps = snap.to;
		}
		currentPot = potAfter;

		history.push({
			stepNum: history.length + 1,
			potBefore,
			potAfter,
			successRate: rate,
			mats: { ...stepMats },
			changes: snapshot
		});
	}

	function undoStep() {
		if (history.length === 0) return;
		const last = history.pop();
		currentPot = last.potBefore;
		for (const ch of last.changes) {
			const slot = slots.find(s => s.statName === ch.statName);
			if (slot) {
				slot.steps = ch.from;
				slot.targetSteps = ch.from;
			}
		}
	}

	function repeatLastStep() {
		if (history.length === 0) return;
		const last = history[history.length - 1];
		// Re-apply the same delta from each change onto current steps
		for (const ch of last.changes) {
			const slot = slots.find(s => s.statName === ch.statName);
			if (slot) {
				slot.targetSteps = slot.steps + ch.delta;
			}
		}
	}

	function resetAll() {
		slots = Array.from({ length: MAX_SLOTS }, (_, i) => makeSlot(i));
		history = [];
		currentPot = startingPot;
	}

	function isLastStep() {
		// Final step: all 8 slots filled, or pot will go ≤ 0
		return slots.every(s => s.stat) || futurePot <= 0;
	}

	// Serialize current app state into a plain object
	function serializeState() {
		return {
			gearType,
			startingPot,
			tec,
			proficiency,
			compassion,
			anvil,
			slots: slots.map(s => ({
				id: s.id,
				statName: s.statName,
				steps: s.steps,
				targetSteps: s.targetSteps
			})),
			history: history.map(h => ({
				stepNum: h.stepNum,
				potBefore: h.potBefore,
				potAfter: h.potAfter,
				successRate: h.successRate,
				mats: { ...h.mats },
				changes: h.changes.map(c => ({ ...c }))
			})),
			currentPot
		};
	}

	// Restore app state from a plain object
	function deserializeState(data) {
		gearType = data.gearType;
		startingPot = data.startingPot;
		tec = data.tec;
		proficiency = data.proficiency;
		compassion = data.compassion;
		anvil = data.anvil;
		currentPot = data.currentPot;
		for (let i = 0; i < MAX_SLOTS; i++) {
			const sd = data.slots[i];
			const def = sd.statName ? getStatDef(sd.statName) : null;
			slots[i] = {
				id: sd.id,
				statName: sd.statName,
				stat: def,
				steps: sd.steps,
				targetSteps: sd.targetSteps
			};
		}
		history = data.history;
	}

	function formulaListSave() {
		localStorage.setItem(FORMULA_KEY, JSON.stringify(formulaList));
	}

	function formulaListLoad() {
		try {
			const raw = localStorage.getItem(FORMULA_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed) && parsed.length > 0) {
					formulaList = parsed;
					return true;
				}
			}
		} catch { /* ignore */ }
		return false;
	}

	function currentFormulaSave() {
		if (!activeFormulaId) return;
		const f = formulaList.find(f => f.id === activeFormulaId);
		if (f) {
			f.data = serializeState();
			formulaListSave();
		}
	}

	function currentFormulaLoad() {
		if (!activeFormulaId) return;
		const f = formulaList.find(f => f.id === activeFormulaId);
		if (f && f.data) {
			deserializeState(f.data);
		}
	}

	function selectFormula(id) {
		if (id === activeFormulaId) return;
		currentFormulaSave();
		activeFormulaId = id;
		currentFormulaLoad();
	}

	function newFormula() {
		currentFormulaSave();
		const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
		const name = `Formula ${formulaList.length + 1}`;
		// save current state into the new formula
		const data = serializeState();
		// reset to fresh state for the new formula
		formulaList = [...formulaList, { id, name, data }];
		activeFormulaId = id;
		formulaListSave();
	}

	function deleteFormula() {
		if (formulaList.length <= 1) return;
		const idx = formulaList.findIndex(f => f.id === activeFormulaId);
		formulaList = formulaList.filter(f => f.id !== activeFormulaId);
		const next = Math.min(idx, formulaList.length - 1);
		activeFormulaId = formulaList[next].id;
		currentFormulaLoad();
		formulaListSave();
	}

	function startRenameFormula() {
		const f = formulaList.find(f => f.id === activeFormulaId);
		if (f) {
			renameBuffer = f.name;
			editingFormulaName = true;
		}
	}

	function commitRename() {
		const f = formulaList.find(f => f.id === activeFormulaId);
		if (f && renameBuffer.trim()) {
			f.name = renameBuffer.trim();
			formulaListSave();
		}
		editingFormulaName = false;
	}

	// Auto-load formula list on init, create default if empty
	$effect(() => {
		if (!_initLoaded) {
			_initLoaded = true;
			untrack(() => {
				const has = formulaListLoad();
				if (!has) {
					const defaultFormula = { id: 'default', name: 'Default', data: serializeState() };
					formulaList = [defaultFormula];
					formulaListSave();
				}
				activeFormulaId = formulaList[0].id;
				currentFormulaLoad();
			});
		}
	});

	// Sync currentPot when startingPot changes (only if no history)
	$effect(() => {
		const pot = startingPot; // track startingPot
		untrack(() => {
			if (history.length === 0) currentPot = pot;
		});
	});

	const canConfirm = $derived(
		pendingSlots.length > 0 && (futurePot >= 1 || isLastStep())
	);

	// Active slot count (for the 8-slot warning)
	let filledSlots = $derived(slots.filter(s => s.stat).length);

	// Filtered stats for picker modal
	let pickerFiltered = $derived(() => {
		const q = statSearch.toLowerCase().trim();
		if (!q) return STAT_DB;
		return STAT_DB.filter(s => s.name.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q) || s.mat.toLowerCase().includes(q));
	});

	// Group filtered by category
	let pickerGroups = $derived(() => {
		const filtered = pickerFiltered();
		const groups = {};
		for (const cat of CATEGORIES) {
			const items = filtered.filter(s => s.cat === cat);
			if (items.length) groups[cat] = items;
		}
		return groups;
	});

	// Effective pot displayed in picker (applies gear type multiplier)
	function effectivePot(stat) {
		const mul = (stat.type === 'o' && gearType === 'armor') ||
		            (stat.type === 'd' && gearType === 'weapon') ? 2 : 1;
		return stat.pot * mul;
	}
</script>

<svelte:head>
	<title>Blacksmith Sim — Toram Lab</title>
</svelte:head>

<StarsBg density={30} />

<div class="page">

	<!-- ─── PAGE HEADER ─── -->
	<div class="page-header">
		<div class="page-title-row">
			<div class="page-icon"><Hammer size={20} /></div>
			<div>
				<h1 class="page-title">BLACKSMITH SIM</h1>
				<p class="page-sub">Custom stat simulator · Toram Online</p>
			</div>
		</div>
		<PixelButton onclick={() => (showHelp = true)} variant="teal" size="sm">
			<Info size={14} />
			HOW TO USE
		</PixelButton>
	</div>

	<!-- ─── SETTINGS BAR ─── -->
	<div class="settings-bar">
		<div class="setting-field">
			<label>Gear Type</label>
			<select bind:value={gearType} onchange={resetAll}>
				<option value="weapon">Weapon</option>
				<option value="armor">Armor</option>
			</select>
		</div>
		<div class="setting-field">
			<label>Starting Pot</label>
			<input type="number" min="1" bind:value={startingPot} />
		</div>
		<div class="setting-field">
			<label>TEC</label>
			<input type="number" min="0" max="255" bind:value={tec} />
		</div>
		<div class="setting-field">
			<label>Proficiency</label>
			<input type="number" min="0" max="250" bind:value={proficiency} />
		</div>
		<div class="setting-toggles">
			<button
				class="toggle-btn"
				class:active={compassion}
				onclick={() => (compassion = !compassion)}
				title="Compassion: -10% material cost"
			>Compassion</button>
			<button
				class="toggle-btn"
				class:active={anvil}
				onclick={() => (anvil = !anvil)}
				title="Anvil: -40% material cost"
			>Anvil</button>
		</div>
		<div class="formula-bar">
			{#if editingFormulaName}
				<input
					class="formula-rename-input"
					type="text"
					bind:value={renameBuffer}
					onkeydown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') editingFormulaName = false; }}
					onblur={commitRename}
					autofocus
				/>
			{:else}
				<select class="formula-select" value={activeFormulaId} onchange={(e) => selectFormula(e.currentTarget.value)}>
					{#each formulaList as f (f.id)}
						<option value={f.id}>{f.name}</option>
					{/each}
				</select>
			{/if}
			<PixelButton variant="teal" size="sm" onclick={newFormula}>
				<Plus size={13} />
				NEW
			</PixelButton>
			<PixelButton variant="teal" size="sm" onclick={startRenameFormula}>
				RENAME
			</PixelButton>
			<PixelButton variant="crimson" size="sm" onclick={deleteFormula} disabled={formulaList.length <= 1}>
				<Trash2 size={13} />
				DEL
			</PixelButton>
		</div>
	</div>

	<!-- ─── MAIN GRID ─── -->
	<div class="main-grid">

		<!-- LEFT: Slot list -->
		<div class="panel">
			<div class="panel-head">
				<span class="pot-display">
					<span class="pot-next" class:val-bad={futurePot < 1}>{futurePot}</span>
					<span class="pot-sep">/</span>
					<span class="pot-cur">{currentPot}</span>
					<span class="pot-unit">pot</span>
				</span>
				<span class="rate-penalty">
					<span class="rp-rate"
						class:val-good={successRate >= 80}
						class:val-warn={successRate >= 50 && successRate < 80}
						class:val-bad={successRate < 50}
					>{Math.floor(successRate)}%</span>
					{#if penaltyMul > 1}
						<span class="rp-sep">·</span>
						<span class="rp-penalty val-warn">×{penaltyMul.toFixed(2)}</span>
					{/if}
				</span>
			</div>
			<div class="panel-body slot-list">
				{#each slots as slot, i (slot.id)}
					<div class="slot-row" class:has-stat={!!slot.stat} class:is-negative={slot.targetSteps < 0}>
						<span class="slot-num">{i + 1}</span>

						<!-- Stat picker button (replaces <select>) -->
						{#if slot.stat}
							<button class="slot-stat-btn" onclick={() => openStatPicker(i)}>
								{slot.statName}
							</button>
						{:else}
							<button class="slot-stat-btn slot-stat-btn--empty" onclick={() => openStatPicker(i)}>
								<Plus size={14} />
								<span>Add Stat</span>
							</button>
						{/if}

						<!-- Step arrows + value -->
						{#if slot.stat}
							<div class="slot-stepper">
								<button
									class="step-btn"
									onclick={() => onTargetChange(i, slot.targetSteps - 1)}
									disabled={slot.targetSteps <= (slot.stat.noNeg ? 0 : -capOf(slot.stat))}
								><ChevronDown size={13} /></button>
								<input
									type="number"
									class="step-val"
									class:negative={slot.targetSteps < 0}
									value={slot.targetSteps}
									oninput={(e) => onTargetChange(i, e.currentTarget.value)}
								/>
								<button
									class="step-btn"
									onclick={() => onTargetChange(i, slot.targetSteps + 1)}
									disabled={slot.targetSteps >= capOf(slot.stat) + 10}
								><ChevronUp size={13} /></button>
							</div>
						{/if}

						<!-- Remove -->
						<button
							class="slot-del"
							onclick={() => { slots[i] = makeSlot(i); }}
							disabled={slot.steps !== 0}
							title="Remove slot (only if not yet confirmed)"
						><Trash2 size={13} /></button>
					</div>
				{/each}
			</div>
		</div>

		<!-- RIGHT: Material cost + actions -->
		<div class="right-col">

			<div class="panel">
				<div class="panel-head"><span class="panel-label">MATERIAL COST</span></div>
				<div class="panel-body">

					<!-- Pending mats -->
					{#if pendingSlots.length > 0}
						<div class="mats-section">
							<span class="mats-label">This step</span>
							<div class="mat-chips">
								{#each MAT_TYPES as mt (mt)}
									{#if pendingMats()[mt] > 0}
										<span class="mat-chip">{Math.ceil(pendingMats()[mt])} {mt}</span>
									{/if}
								{/each}
							</div>
						</div>
					{/if}

					<!-- Warnings -->
					{#if filledSlots >= MAX_SLOTS && !isLastStep()}
						<div class="warning">⚠ All 8 slots filled — this must be the final step</div>
					{/if}
					{#if futurePot < 1 && !isLastStep()}
						<div class="warning">⚠ Pot will reach 0 — only confirm if this is your final step</div>
					{/if}

					<!-- Actions -->
					<div class="action-row">
						<PixelButton onclick={confirmStep} disabled={!canConfirm} size="sm">
							CONFIRM STEP
						</PixelButton>
						<PixelButton onclick={repeatLastStep} disabled={history.length === 0} variant="teal" size="sm">
							REPEAT
						</PixelButton>
						<PixelButton onclick={undoStep} disabled={history.length === 0} variant="crimson" size="sm">
							UNDO
						</PixelButton>
					</div>
				</div>
			</div>

			<!-- Total mats -->
			{#if history.length > 0}
				<div class="panel">
					<div class="panel-head"><span class="panel-label">TOTAL MATERIALS USED</span></div>
					<div class="panel-body">
						<div class="mat-rows">
							{#each MAT_TYPES as mt (mt)}
								{#if totalMats()[mt] > 0}
									<div class="mat-row">
										<span class="mat-name">{mt}</span>
										<span class="mat-val">{totalMats()[mt]}</span>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>
			{/if}

		</div>
	</div>

	<!-- ─── HISTORY ─── -->
	{#if history.length > 0}
		<div class="panel history-panel">
			<div class="panel-head"><span class="panel-label">STEP HISTORY</span></div>
			<div class="panel-body history-list">
				{#each history as h (h.stepNum)}
					<div class="hist-item">
						<div class="hist-head">
							<span class="hist-num">Step #{h.stepNum}</span>
							<span class="hist-pot">{h.potBefore} → {h.potAfter} pot</span>
							<span class="hist-rate"
								class:val-good={h.successRate >= 80}
								class:val-warn={h.successRate >= 50 && h.successRate < 80}
							class:val-bad={h.successRate < 50}
							>{h.successRate}%</span>
						</div>
						<div class="hist-changes">
							{#each h.changes as ch (ch.statName + ch.delta)}
								<span class="hist-tag">
									{ch.statName}
									<span class:neg={ch.delta < 0}>{ch.delta > 0 ? '+' : ''}{ch.delta}</span>
								</span>
							{/each}
						</div>
						<div class="hist-mats">
							{#each MAT_TYPES as mt (mt)}
								{#if h.mats[mt] > 0}
									<span class="hist-mat">{h.mats[mt]} {mt}</span>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

</div>

<!-- ─── STAT PICKER MODAL ─── -->
<Modal title="Select Stat" open={showStatPicker} onclose={() => { showStatPicker = false; pickingSlotIndex = -1; }}>
	<div class="picker-body">
		<input
			type="search"
			class="picker-search"
			placeholder="Search stats…"
			bind:value={statSearch}
		/>
		<div class="picker-groups">
			{#each Object.entries(pickerGroups()) as [cat, stats] (cat)}
				<div class="picker-group">
					<div class="picker-group-label">{cat}</div>
					<div class="picker-stats">
						{#each stats as sd (sd.name)}
							<button class="picker-stat" onclick={() => pickStat(sd.name)}>
								<span class="picker-stat-name">{sd.name}</span>
								<span class="picker-stat-meta">
								<span class="picker-stat-type" class:type-u={sd.type === 'u'} class:type-o={sd.type === 'o'} class:type-d={sd.type === 'd'} class:type-e={sd.type === 'e'}>{sd.type === 'u' ? 'Universal' : sd.type === 'o' ? 'Offensive' : sd.type === 'd' ? 'Defensive' : 'Element'}</span>
									<span class="picker-stat-pot">{effectivePot(sd)} pot</span>
									<span class="picker-stat-sep">·</span>
									<span class="picker-stat-mat">{sd.mat}</span>
								</span>
							</button>
						{/each}
					</div>
				</div>
			{/each}
			{#if Object.keys(pickerGroups()).length === 0}
				<div class="picker-empty">No stats match your search</div>
			{/if}
		</div>
	</div>
</Modal>

<!-- ─── HELP MODAL ─── -->
<Modal title="How to Use" open={showHelp} onclose={() => (showHelp = false)}>
	<div class="help-body">
		<section>
			<h4>Key Rules</h4>
			<ul>
				<li>Always leave <strong>≥1 pot</strong> until the final step.</li>
				<li>Never fill all 8 slots until the final step.</li>
				<li>Add negative stats first to recover pot, then positives.</li>
			</ul>
		</section>
		<section>
			<h4>Formulas</h4>
			<ul>
				<li><strong>Mat cost:</strong> baseCost × N² per step, summed</li>
				<li><strong>Mat reduction:</strong> ⌊prof/10⌋ + ⌊prof/50⌋ %</li>
				<li><strong>Pot cost:</strong> stat.pot/step; ×2 after step 20</li>
				<li><strong>Neg pot return:</strong> (5 + TEC/10)% of positive; halved after cap</li>
				<li><strong>Penalty:</strong> 5% × N² per N stats in same category</li>
				<li><strong>Success rate:</strong> 160 + (230 × finalPot) / prevPot</li>
				<li><strong>Offensive on armor / Defensive on weapon:</strong> pot cost ×2</li>
			</ul>
		</section>
		<section>
			<h4>Type Reference</h4>
			<ul>
				<li><strong>Universal:</strong> same pot on weapon & armor</li>
				<li><strong>Offensive:</strong> weapon = normal, armor = 2× pot</li>
				<li><strong>Defensive:</strong> armor = normal, weapon = 2× pot</li>
				<li><strong>Element:</strong> weapon only, max 1 per weapon</li>
			</ul>
		</section>
	</div>
</Modal>

<style>
	.page {
		max-width: 1100px;
		margin: 0 auto;
		padding: 1.5rem;
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Header */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.page-title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.page-icon {
		width: 42px;
		height: 42px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--gold);
	}
	.page-title {
		font-family: var(--pixel);
		font-size: 0.75rem;
		color: var(--gold);
		letter-spacing: 0.08em;
	}
	.page-sub {
		font-size: 0.78rem;
		color: var(--text-dim);
		margin-top: 0.2rem;
	}

	/* Settings bar */
	.settings-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: flex-end;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.85rem 1rem;
	}
	.setting-field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 110px;
	}
	.setting-field label {
		font-size: 0.7rem;
		color: var(--text-dim);
	}
	.setting-field input,
	.setting-field select {
		width: 100%;
		padding: 5px 8px;
		font-size: 0.82rem;
	}
	.setting-toggles {
		display: flex;
		align-items: flex-end;
		gap: 0.35rem;
		padding-bottom: 1px;
	}
	.toggle-btn {
		font-family: var(--pixel);
		font-size: 0.45rem;
		letter-spacing: 0.06em;
		padding: 5px 10px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--bg-deep);
		color: var(--text-dim);
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}
	.toggle-btn:hover {
		border-color: var(--text-mid);
	}
	.toggle-btn.active {
		border-color: var(--teal);
		color: var(--teal);
		background: rgba(45, 211, 183, 0.06);
	}
	.setting-actions {
		display: flex;
		align-items: flex-end;
		padding-bottom: 0;
	}

	/* Main grid */
	.main-grid {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 820px) {
		.main-grid { grid-template-columns: 1fr; }
	}

	/* Panel */
	.panel {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 6px;
		overflow: hidden;
	}
	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.55rem 1rem;
		background: rgba(8, 12, 20, 0.5);
		border-bottom: 1px solid var(--border);
	}
	.panel-label {
		font-family: var(--pixel);
		font-size: 0.48rem;
		color: var(--text-dim);
		letter-spacing: 0.12em;
	}
	.pot-display {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		font-family: var(--pixel);
	}
	.pot-next {
		color: var(--text-bright);
		font-size: 0.65rem;
	}
	.pot-next.val-bad { color: var(--crimson); }
	.pot-sep, .pot-cur { color: var(--text-dim); font-size: 0.55rem; }
	.pot-unit { color: var(--text-dim); font-size: 0.42rem; }
	.panel-body {
		padding: 0.75rem;
	}

	/* Slot list */
	.slot-list {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.slot-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.65rem;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: 4px;
		transition: border-color 0.2s;
	}
	.slot-row:hover { border-color: var(--border-glow); }
	.slot-row.has-stat { border-color: rgba(74, 158, 255, 0.2); }
	.slot-row.is-negative { border-color: rgba(155, 114, 207, 0.3); }
	.slot-num {
		font-family: var(--pixel);
		font-size: 0.48rem;
		color: var(--gold);
		width: 16px;
		text-align: center;
		flex-shrink: 0;
	}

	/* Stat picker button */
	.slot-stat-btn {
		flex: 1;
		min-width: 0;
		font-size: 0.8rem;
		padding: 6px 10px;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--bg-deep);
		color: var(--text-bright);
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.3;
	}
	.slot-stat-btn:hover {
		border-color: var(--blue);
		color: var(--blue);
	}
	.slot-stat-btn--empty {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--text-dim);
		font-size: 0.78rem;
	}
	.slot-stat-btn--empty:hover {
		color: var(--teal);
		border-color: var(--teal);
	}

	/* Stepper */
	.slot-stepper {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}
	.step-btn {
		background: var(--bg-deep);
		border: 1px solid var(--border);
		color: var(--text-mid);
		border-radius: 3px;
		padding: 3px 4px;
		display: flex;
		align-items: center;
		transition: all 0.15s;
		line-height: 1;
		min-height: 28px;
		min-width: 24px;
		justify-content: center;
	}
	.step-btn:hover:not(:disabled) {
		border-color: var(--blue);
		color: var(--blue);
	}
	.step-btn:disabled { opacity: 0.3; cursor: not-allowed; }
	.step-val {
		width: 48px;
		text-align: center;
		font-size: 0.85rem;
		padding: 4px 2px;
	}
	.step-val.negative { color: var(--purple); }

	.slot-del {
		background: none;
		border: 1px solid var(--border);
		color: var(--text-dim);
		border-radius: 4px;
		padding: 4px 5px;
		display: flex;
		align-items: center;
		transition: all 0.2s;
		flex-shrink: 0;
		min-height: 28px;
		min-width: 28px;
		justify-content: center;
	}
	.slot-del:hover:not(:disabled) {
		color: var(--crimson);
		border-color: var(--crimson);
		background: rgba(230, 57, 70, 0.1);
	}
	.slot-del:disabled { opacity: 0.25; cursor: not-allowed; }

	/* Right column */
	.right-col {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.rate-penalty {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-family: var(--pixel);
		font-size: 0.55rem;
	}
	.rp-rate { }
	.rp-sep { color: var(--text-dim); }
	.rp-penalty { }
	.val-good { color: var(--teal); }
	.val-warn { color: var(--gold); }
	.val-bad  { color: var(--crimson); }

	.mats-section {
		margin-bottom: 0.75rem;
	}
	.mats-label {
		font-size: 0.7rem;
		color: var(--text-dim);
		display: block;
		margin-bottom: 0.4rem;
	}
	.mat-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.mat-chip {
		font-size: 0.75rem;
		padding: 3px 8px;
		background: rgba(74, 158, 255, 0.08);
		border: 1px solid rgba(74, 158, 255, 0.2);
		border-radius: 4px;
		color: var(--blue);
	}

	.warning {
		font-size: 0.75rem;
		color: var(--gold);
		padding: 0.5rem 0.7rem;
		background: rgba(244, 197, 66, 0.06);
		border: 1px solid rgba(244, 197, 66, 0.2);
		border-radius: 4px;
		margin-bottom: 0.6rem;
	}

	.action-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	/* Total mats */
	.mat-rows {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.mat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0.6rem;
		background: var(--bg-panel);
		border-radius: 4px;
		font-size: 0.82rem;
	}
	.mat-name { color: var(--text-mid); }
	.mat-val  { color: var(--text-bright); font-weight: 600; }

	/* History */
	.history-panel { margin-top: 0; }
	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.hist-item {
		padding: 0.65rem 0.85rem;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-left: 3px solid var(--gold-dim);
		border-radius: 4px;
	}
	.hist-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.4rem;
		flex-wrap: wrap;
	}
	.hist-num {
		font-family: var(--pixel);
		font-size: 0.48rem;
		color: var(--gold);
	}
	.hist-pot {
		font-size: 0.78rem;
		color: var(--text-dim);
	}
	.hist-rate {
		font-size: 0.78rem;
		font-weight: 700;
		margin-left: auto;
	}
	.hist-changes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.35rem;
	}
	.hist-tag {
		font-size: 0.78rem;
		padding: 2px 8px;
		background: rgba(255,255,255,0.04);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-bright);
	}
	.hist-tag .neg { color: var(--purple); }
	.hist-mats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.hist-mat {
		font-size: 0.72rem;
		color: var(--text-dim);
	}

	/* === STAT PICKER MODAL === */
	.picker-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.picker-search {
		width: 100%;
		padding: 8px 10px;
		font-size: 0.85rem;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: var(--bg-deep);
		color: var(--text-bright);
	}
	.picker-search:focus {
		border-color: var(--blue);
		outline: none;
	}
	.picker-groups {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		max-height: 55vh;
		overflow-y: auto;
	}
	.picker-group { }
	.picker-group-label {
		font-family: var(--pixel);
		font-size: 0.48rem;
		color: var(--gold);
		margin-bottom: 0.3rem;
		letter-spacing: 0.06em;
	}
	.picker-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.3rem;
	}
	.picker-stat {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.5rem 0.6rem;
		background: var(--bg-panel);
		border: 1px solid var(--border);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		min-height: 44px;
		justify-content: center;
	}
	.picker-stat:hover {
		border-color: var(--blue);
		background: rgba(74, 158, 255, 0.06);
	}
	.picker-stat-name {
		font-size: 0.82rem;
		color: var(--text-bright);
		font-weight: 500;
		line-height: 1.3;
	}
	.picker-stat-meta {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.picker-stat-type {
		font-size: 0.6rem;
		font-family: var(--pixel);
		padding: 1px 4px;
		border-radius: 2px;
		border: 1px solid var(--border);
		letter-spacing: 0.04em;
	}
	.picker-stat-type.type-u { color: var(--teal); border-color: var(--teal); }
	.picker-stat-type.type-o { color: var(--crimson); border-color: var(--crimson); }
	.picker-stat-type.type-d { color: var(--blue); border-color: var(--blue); }
	.picker-stat-type.type-e { color: var(--gold); border-color: var(--gold); }
	.picker-stat-pot {
		font-size: 0.7rem;
		color: var(--text-dim);
	}
	.picker-stat-sep {
		font-size: 0.65rem;
		color: var(--text-dim);
		opacity: 0.4;
	}
	.picker-stat-mat {
		font-size: 0.7rem;
		color: var(--text-dim);
	}
	.picker-empty {
		font-size: 0.82rem;
		color: var(--text-dim);
		text-align: center;
		padding: 1.5rem 0;
	}

	/* Help modal */
	.help-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.help-body section h4 {
		font-family: var(--pixel);
		font-size: 0.55rem;
		color: var(--gold);
		letter-spacing: 0.06em;
		margin-bottom: 0.5rem;
	}
	.help-body ul {
		padding-left: 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.help-body li {
		font-size: 0.82rem;
		color: var(--text-mid);
		line-height: 1.5;
	}
	.help-body strong { color: var(--text-bright); }

	/* ─── MOBILE OPTIMIZATIONS ─── */
	@media (max-width: 600px) {
		.page {
			padding: 0.75rem;
			gap: 0.75rem;
		}
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
		.settings-bar {
			padding: 0.65rem;
			gap: 0.5rem;
		}
		.setting-field {
			min-width: 0;
			flex: 1 1 calc(50% - 0.5rem);
		}
		.setting-field input,
		.setting-field select {
			font-size: 0.85rem;
			padding: 7px 8px;
		}
		.setting-actions {
			flex: 1 1 100%;
			justify-content: center;
		}
		.panel-body {
			padding: 0.5rem;
		}
		.slot-row {
			padding: 0.4rem 0.5rem;
			gap: 0.3rem;
			flex-wrap: wrap;
		}
		.slot-num {
			width: 14px;
		}
		.slot-stat-btn {
			font-size: 0.82rem;
			padding: 7px 8px;
			flex: 1 1 auto;
		}
		.slot-stepper {
			order: 10;
			flex: 0 0 auto;
		}
		.step-btn {
			min-height: 32px;
			min-width: 32px;
			padding: 4px 6px;
		}
		.step-val {
			width: 44px;
			font-size: 0.9rem;
			padding: 5px 2px;
		}
		.slot-del {
			min-height: 32px;
			min-width: 32px;
		}
		.picker-stats {
			grid-template-columns: 1fr;
		}
		.picker-stat {
			min-height: 48px;
		}
		.action-row {
			flex-direction: column;
		}
		.action-row :global(.pixel-btn) {
			width: 100%;
			justify-content: center;
		}
		.hist-item {
			padding: 0.5rem 0.65rem;
		}
		.hist-head {
			gap: 0.4rem;
		}
	}
</style>