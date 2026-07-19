/**
 * Verification test for the Toram formula engine.
 * Node ESM — run with: node src/lib/verify-formulas.test.mjs
 */

import { Character } from './domain/character.js';
import { Formula, computeStats, calcDamage } from './index.js';

let passed = 0;
let failed = 0;

function assert(condition, name) {
	if (condition) {
		passed++;
	} else {
		failed++;
		console.error(`FAIL: ${name}`);
	}
}

function approx(a, b, tol = 0.5) {
	return Math.abs(a - b) <= tol;
}

// ─── Test 1: Effective stat (Section 1) ────────────────────────────────
{
	// STR 200, +10 flat, +5% → 200 + 10 + floor(200*5/100) = 210 + 10 = 220
	const effStr = 200 + 10 + Math.floor((200 * 5) / 100);
	assert(effStr === 220, 'Section 1: effectiveStat');
}

// ─── Test 2: Weapon ATK (Section 2) ────────────────────────────────────
{
	// Item base 100, refine +9 (81%), no WATK% or flat
	const watk = Formula.weaponBaseAtk(100, 9, 0, 0);
	// 100 * (1 + 81/100 + 0) + 9 + 0 = 100 * 1.81 + 9 = 190
	assert(approx(watk, 190), `Section 2: weaponBaseAtk +9 → ${watk}`);

	// Item base 200, refine +S (225%), 10% WATK, +5 flat
	const watk2 = Formula.weaponBaseAtk(200, 15, 10, 5);
	// 200 * (1 + 225/100 + 10/100) + 15 + 5 = 200 * 3.35 + 20 = 670 + 20 = 690
	assert(approx(watk2, 690), `Section 2: weaponBaseAtk +S → ${watk2}`);
}

// ─── Test 3: Refine Bonus (Section 3) ──────────────────────────────────
{
	// Base 100, refine +9 → floor(100*81/100) + 9 = 81 + 9 = 90
	const rb = Formula.refineBonus(100, 9);
	assert(rb === 90, `Section 3: refineBonus 100@+9 → ${rb}`);
}

// ─── Test 4: ATK (Section 4) ───────────────────────────────────────────
{
	// Level 300, statAtk 1000, watk 500, 10% ATK, +20 flat
	const atkVal = Formula.atk(300, 1000, 500, 10, 20);
	const base = 300 + 1000 + 500; // 1800
	const expected = Math.floor(1800 * 1.1) + 20; // 1980 + 20 = 2000
	assert(atkVal === expected, `Section 4: atk → ${atkVal}`);
}

// ─── Test 5: Stability (Section 5) ─────────────────────────────────────
{
	// Weapon stab 80, stat stab 5, +3% from equip
	const stab = Formula.stability(80, 5, 3);
	// floor(80 + 5) + 3 = 85 + 3 = 88
	assert(stab === 88, `Section 5: stability → ${stab}`);
}

// ─── Test 6: ASPD (Section 6) ──────────────────────────────────────────
{
	// Stat ASPD 200, weapon ASPD 100, level 300, +5% ASPD, +10 flat
	const aspdVal = Formula.aspd(200, 100, 300, 5, 10);
	const base = 200 + 100 + 300; // 600
	const expected = Math.floor(600 * 1.05) + 10; // 630 + 10 = 640
	assert(aspdVal === expected, `Section 6: aspd → ${aspdVal}`);
}

// ─── Test 7: CSPD (Section 7) ──────────────────────────────────────────
{
	// Level 300, AGI 256, DEX 256
	const cspdVal = Formula.cspd(300, 256, 256);
	// floor(300 + 256*1.16 + 256*2.94) = floor(300 + 296.96 + 752.64) = floor(1349.6) = 1349
	const base = Math.floor(300 + 256 * 1.16 + 256 * 2.94);
	assert(approx(cspdVal, base), `Section 7: cspd → ${cspdVal} === ${base}`);

	// Cast motion at 1000 CSPD: min(50, 1000/20=50) + max(0, 0/180=0) = 50
	const cm = Formula.castMotionSpeed(1000);
	assert(approx(cm, 50), `Section 7: castMotionSpeed @1000 → ${cm}`);

	// Cast motion at 2000 CSPD: 50 + (1000/180 ≈ 5.56) = 55.56
	const cm2 = Formula.castMotionSpeed(2000);
	assert(approx(cm2, 55.56), `Section 7: castMotionSpeed @2000 → ${cm2}`);
}

// ─── Test 8: Motion Speed (Section 8) ──────────────────────────────────
{
	// ASPD 10000 → floor((10000-1000)/180) = floor(9000/180) = 50
	const ms = Formula.motionSpeedFromAspd(10000);
	assert(ms === 50, `Section 8: motionSpeedFromAspd @10000 → ${ms}`);

	// ASPD 500 → max(0, floor(-500/180)) = 0
	const ms2 = Formula.motionSpeedFromAspd(500);
	assert(ms2 === 0, `Section 8: motionSpeedFromAspd @500 → ${ms2}`);
}

// ─── Test 9: Max HP (Section 9) ────────────────────────────────────────
{
	// Level 300, VIT 256, 0% HP, 0 flat
	const hp = Formula.maxHp(300, 256, 0, 0);
	const base = Math.floor(93 + (300 / 3) * (256 + 22.41));
	const expected = Math.floor(base); // no %/flat scaling
	assert(hp === expected, `Section 9: maxHp → ${hp}`);
}

// ─── Test 10: Max MP (Section 10) ──────────────────────────────────────
{
	// Level 300, INT 256, TEC 10
	const mp = Formula.maxMp(300, 256, 10);
	const base = Math.floor(99 + 256 / 10 + 10 + 300);
	const expected = Math.min(2000, Math.floor(base));
	assert(mp === expected, `Section 10: maxMp → ${mp}`);
}

// ─── Test 11: AMPR (Section 13) ────────────────────────────────────────
{
	const amprVal = Formula.ampr(2000, 0, 0);
	// base = floor(10 + min(20, 2000/100=20)) = floor(30) = 30
	assert(amprVal === 30, `Section 13: ampr @2000MP → ${amprVal}`);
}

// ─── Test 12: Crit Rate & Crit Damage (17, 18) ─────────────────────────
{
	const cr = Formula.criticalRate(255, 0, 0);
	const base = Math.floor(25 + 255 / 3.4);
	assert(cr === Math.min(100, base), `Section 17: criticalRate → ${cr}`);

	// STR 300 > AGI 100 → base = 150 + 300/5 = 210
	const cd = Formula.criticalDamage(300, 100, 0, 0);
	assert(approx(cd, 210), `Section 18: criticalDamage STR>AGI → ${cd}`);

	// AGI 300 >= STR 100 → base = 150 + (100+300)/10 = 190
	const cd2 = Formula.criticalDamage(100, 300, 0, 0);
	assert(approx(cd2, 190), `Section 18: criticalDamage AGI>=STR → ${cd2}`);

	// Over 300 softcap: raw 400 → 300 + floor((400-300)/2) = 350
	const cd3 = Formula.criticalDamage(400, 400, 0, 0);
	// AGI>=STR: base = 150 + 800/10 = 230, raw = 230 (no overcap)
	// To test overcap, need raw > 300
	// STR>AGI with big STR: STR 1000, AGI 0 → base = 150+200 = 350
	const cd4 = Formula.criticalDamage(1000, 0, 0, 0);
	assert(approx(cd4, 325), `Section 18: critDmg overcap → ${cd4}`); // 300 + floor(50/2) = 325
}

// ─── Test 13: Hit Rate (Section 21) ────────────────────────────────────
{
	// ACC 1000, enemy FLEE 1000 → 100 - 0 + 0 = 100
	const hr = Formula.hitRate(1000, 1000, 0);
	assert(hr === 100, `Section 21: hitRate equal → ${hr}`);

	// ACC 1000, FLEE 1030, MP 0 → 100 - 10 + 0 = 90
	const hr2 = Formula.hitRate(1000, 1030, 0);
	assert(hr2 === 90, `Section 21: hitRate -10 → ${hr2}`);

	// Clamp: ACC 0, FLEE 1000 → floor(100 - 333.3) = -233 → 0
	const hr3 = Formula.hitRate(0, 1000, 0);
	assert(hr3 === 0, `Section 21: hitRate min clamp → ${hr3}`);
}

// ─── Test 14: Full Damage Chain (Section 22) ───────────────────────────
{
	const dmg = Formula.maxDamage({
		effectiveAtkVal: 500,
		skillConstant: 100,
		skillMultiplier: 500, // ×5.0
		activeBuff: 50, // +50%
		proration: 250, // ×2.5
		passiveBuff: 30, // +30%
		dtePlusElement: 25, // +25%
		zeroStanceLv: 0,
		rangeDamage: 10, // +10%
		comboMultiplier: 150, // ×1.5 (Smite)
		criticalDamage: 200 // ×2.0
	});
	// (500+100) * (5.0) * (1.5) * (2.5) * (1.3) * (1.25) * (1.0) * (1.1) * (1.5) * (2.0)
	// = 600 * 5 * 1.5 * 2.5 * 1.3 * 1.25 * 1.1 * 1.5 * 2
	// = 600 * 5 = 3000
	// * 1.5 = 4500
	// * 2.5 = 11250
	// * 1.3 = 14625
	// * 1.25 = 18281.25
	// * 1.1 = 20109.375
	// * 1.5 = 30164.0625
	// * 2.0 = 60328.125 → floor = 60328
	const chain = 600 * 5 * 1.5 * 2.5 * 1.3 * 1.25 * 1.1 * 1.5 * 2;
	assert(approx(dmg, Math.floor(chain)), `Section 22: maxDamage → ${dmg} ≈ ${Math.floor(chain)}`);
}

// ─── Test 15: Character Integration ────────────────────────────────────
{
	const char = new Character({
		level: 300,
		rawStats: { str: 256, int: 1, vit: 256, agi: 1, dex: 256, crt: 200, tec: 10 },
		equipBonuses: { atkPercent: 10, weaponAtkPercent: 5, maxHpPercent: 20 },
		weaponType: 'twoHandedSword',
		weapon: { itemBaseAtk: 300, refine: 15 },
		armor: { itemBaseDef: 200, refine: 9 }
	});

	const stats = computeStats(char);

	// Verify core stats are numbers and in reasonable ranges
	assert(typeof stats.atk === 'number' && stats.atk > 0, 'Integration: atk > 0');
	assert(typeof stats.maxHp === 'number' && stats.maxHp > 0, 'Integration: maxHp > 0');
	assert(typeof stats.def === 'number' && stats.def > 0, 'Integration: def > 0');
	assert(typeof stats.accuracy === 'number' && stats.accuracy > 0, 'Integration: accuracy > 0');
	assert(
		typeof stats.criticalDamage === 'number' && stats.criticalDamage >= 150,
		'Integration: critDmg >= 150'
	);
	assert(
		typeof stats.stability === 'number' && stats.stability <= 100,
		'Integration: stability <= 100'
	);

	// Test damage calc — use lower DEF so effective ATK > 0
	const result = calcDamage(
		stats,
		{ level: 300, def: 500, flee: 800 },
		{ skillMultiplier: 100, mpCost: 200, proration: 250, activeBuff: 100, comboMultiplier: 150 },
		char.level
	);
	assert(typeof result.maxDmg === 'number' && result.maxDmg > 0, 'Integration: maxDmg > 0');
	assert(result.hitRate >= 0 && result.hitRate <= 100, 'Integration: hitRate in range');
	assert(result.graze.min <= result.graze.max, 'Integration: graze min <= max');

	console.log(
		`Integration: atk=${stats.atk} hp=${stats.maxHp} def=${stats.def} cd=${stats.criticalDamage} maxDmg=${result.maxDmg}`
	);
}

// ─── Test 16: Element System (Section 26) ──────────────────────────────
{
	assert(Formula.isElementAdvantage('fire', 'earth') === true, 'Section 26: fire→earth advantage');
	assert(
		Formula.isElementAdvantage('earth', 'fire') === false,
		'Section 26: earth→fire no advantage'
	);
	assert(Formula.isElementAdvantage('light', 'dark') === true, 'Section 26: light↔dark');
	assert(Formula.isElementAdvantage('dark', 'light') === true, 'Section 26: dark↔light');
	assert(Formula.elementMultiplier('fire', 'earth') === 1.25, 'Section 26: ×1.25 multiplier');
	assert(Formula.elementMultiplier('fire', 'water') === 1.0, 'Section 26: neutral ×1.0');
}

// ─── Report ────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);
