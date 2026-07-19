# Toram Online — Complete Formula Reference

> Pure game mechanics documentation. All formulas reflect confirmed in-game behavior.

---

## Table of Contents

1. [Primary Stats](#1-primary-stats)
2. [Weapon ATK Calculation](#2-weapon-atk-calculation)
3. [Refine Bonus](#3-refine-bonus)
4. [Character ATK & MATK](#4-character-atk--matk)
5. [Stability](#5-stability)
6. [Attack Speed (ASPD)](#6-attack-speed-aspd)
7. [Cast Speed (CSPD) & Cast Motion Speed](#7-cast-speed-cspd--cast-motion-speed)
8. [Motion Speed](#8-motion-speed)
9. [Max HP](#9-max-hp)
10. [Max MP](#10-max-mp)
11. [Natural HP Regen (NHPR)](#11-natural-hp-regen-nhpr)
12. [Natural MP Regen (NMPR)](#12-natural-mp-regen-nmpr)
13. [Attack MP Recovery (AMPR)](#13-attack-mp-recovery-ampr)
14. [DEF & MDEF](#14-def--mdef)
15. [Flee](#15-flee)
16. [Accuracy](#16-accuracy)
17. [Critical Rate](#17-critical-rate)
18. [Critical Damage](#18-critical-damage)
19. [Magic Critical Rate](#19-magic-critical-rate)
20. [Magic Critical Damage](#20-magic-critical-damage)
21. [Hit Rate](#21-hit-rate)
22. [Damage Formula](#22-damage-formula)
23. [Graze (Stability Damage Range)](#23-graze-stability-damage-range)
24. [Per-Weapon Base Stat Contributions](#24-per-weapon-base-stat-contributions)
25. [Sub-Weapon Rules](#25-sub-weapon-rules)
26. [Elemental Effectiveness](#26-elemental-effectiveness)
27. [Difficulty Modifiers](#27-difficulty-modifiers)

---

## 1. Primary Stats

All primary stats (STR, INT, VIT, AGI, DEX) follow the same base formula:

$$\text{Effective Stat} = \text{Base Stat} + \text{Flat Bonus} + \left\lfloor \text{Base Stat} \times \frac{\text{Stat \%}}{100} \right\rfloor$$

- **Base Stat** = stat points allocated by the player
- **Flat Bonus** = flat "+STR", "+INT", etc. from equipment and Crystas
- **Stat %** = percentage bonus from equipment and Crystas (e.g., "+STR %")

---

## 2. Weapon ATK Calculation

The weapon's effective base ATK factors in refine level and equipment WATK bonuses:

$$\text{Weapon Base ATK} = \text{Item Base ATK} \times \left(1 + \frac{\text{Refine}^2}{100} + \frac{\text{Equipment WATK\%}}{100}\right) + \text{Refine} + \text{Flat WATK}$$

Where:

- **Item Base ATK** — the raw base ATK printed on the weapon before any refine
- **Refine** — the refine level (0 through +S, internally 0–15)
- **Equipment WATK%** — percentage Weapon ATK from equipment and Crystas only (not skill buffs)
- **Flat WATK** — flat Weapon ATK bonus from equipment and Crystas

## 3. Refine Bonus

Both weapons and armor follow the same quadratic refine formula:

$$\text{Refine Bonus} = \left\lfloor \frac{\text{Base Stat} \times \text{Refine}^2}{100} \right\rfloor + \text{Refine}$$

- For weapons: Base Stat = Item Base ATK → contributes to Weapon Base ATK
- For armor: Base Stat = Item Base DEF → contributes to DEF

The quadratic term (`Refine²`) means higher refine levels yield exponentially larger bonuses. The flat `+Refine` represents a small linear bonus on top.

| Refine Level | Label | Quadratic Factor |
| :----------: | :---: | :--------------: |
|      0       |  +0   |        0%        |
|      3       |  +3   |        9%        |
|      5       |  +5   |       25%        |
|      9       |  +9   |       81%        |
|      10      |  +E   |       100%       |
|      15      |  +S   |       225%       |

---

## 4. Character ATK & MATK

### ATK

ATK is built in two stages. First, a base value combining stat contributions and weapon base ATK:

$$\text{ATK Base} = \text{Level} + \text{Stat ATK} + \text{Weapon Base ATK}$$

Where **Stat ATK** depends on weapon type (see [Section 24](#24-per-weapon-base-stat-contributions)).

Then the final ATK:

$$\text{ATK} = \left\lfloor \text{ATK Base} \times \left(1 + \frac{\text{ATK\%}}{100}\right) \right\rfloor + \text{Flat ATK}$$

### MATK

$$\text{MATK Base} = \text{Level} + \text{Stat MATK} + \text{Weapon MATK}$$

$$\text{MATK} = \left\lfloor \text{MATK Base} \times \left(1 + \frac{\text{MATK\%}}{100}\right) \right\rfloor + \text{Flat MATK}$$

Where **Stat MATK** and **Weapon MATK** also depend on weapon type (see [Section 24](#24-per-weapon-base-stat-contributions)).

---

## 5. Stability

$$\text{Stability} = \max\!\left(0,\ \min\!\left(100,\ \lfloor \text{Weapon Stab} + \text{Stat Stab} \rfloor + \text{Stability\%} \right)\right)$$

- **Weapon Stab** — base stability % printed on the weapon
- **Stat Stab** — stability contributed by stats (varies by weapon type, see [Section 24](#24-per-weapon-base-stat-contributions))
- **Stability%** — flat stability % bonus from equipment and Crystas

Stability is capped at **100%**. It defines the damage variance range (see [Section 23](#23-graze-stability-damage-range)).

---

## 6. Attack Speed (ASPD)

$$\text{ASPD Base} = \text{Stat ASPD} + \text{Weapon ASPD} + \text{Level}$$

$$\text{ASPD} = \left\lfloor \text{ASPD Base} \times \left(1 + \frac{\text{ASPD\%}}{100}\right) \right\rfloor + \text{Flat ASPD}$$

Where **Stat ASPD** and **Weapon ASPD** (a flat value per weapon type) are both weapon-type-dependent (see [Section 24](#24-per-weapon-base-stat-contributions)).

---

## 7. Cast Speed (CSPD) & Cast Motion Speed

### CSPD

$$\text{CSPD Base} = \left\lfloor \text{Level} + \text{AGI} \times 1.16 + \text{DEX} \times 2.94 \right\rfloor$$

$$\text{CSPD} = \left\lfloor \text{CSPD Base} \times \left(1 + \frac{\text{CSPD\%}}{100}\right) \right\rfloor + \text{Flat CSPD}$$

### Cast Motion Speed

Cast Motion Speed determines how fast casting animations play:

$$\text{Cast Motion Speed} = \min\!\left(50,\ \frac{\text{CSPD}}{20}\right) + \max\!\left(0,\ \frac{\text{CSPD} - 1000}{180}\right)$$

At 1000 CSPD, cast animations play at half their normal duration. The formula has two segments:

- Below 1000 CSPD: linear scaling up to +50
- Above 1000 CSPD: additional bonus from the second term

---

## 8. Motion Speed

Motion Speed affects how fast attack animations play (not cast animations):

$$\text{Motion Speed from ASPD} = \min\!\left(50,\ \max\!\left(0,\ \left\lfloor \frac{\text{ASPD} - 1000}{180} \right\rfloor \right)\right)$$

$$\text{Total Motion Speed} = \text{Motion Speed from ASPD} + \text{Motion Speed\%}$$

At 10,000 ASPD, the maximum bonus of +50% faster animations is reached.

---

## 9. Max HP

$$\text{HP Base} = \left\lfloor 93 + \frac{\text{Level}}{3} \times (\text{VIT} + 22.41) \right\rfloor$$

$$\text{Max HP} = \left\lfloor \text{HP Base} \times \left(1 + \frac{\text{MaxHP\%}}{100}\right) \right\rfloor + \text{Flat MaxHP}$$

> The constant **22.41** is precise. Using 22.4 produces incorrect results.

---

## 10. Max MP

$$\text{MP Base} = \left\lfloor 99 + \frac{\text{INT}}{10} + \text{TEC} + \text{Level} \right\rfloor$$

$$\text{Max MP} = \min\!\left(2000,\ \left\lfloor \text{MP Base} \times \left(1 + \frac{\text{MaxMP\%}}{100}\right) + \text{Flat MaxMP} \right\rfloor\right)$$

Max MP is hard-capped at **2000**.

---

## 11. Natural HP Regen (NHPR)

$$\text{Base NHPR} = \left\lfloor \left\lfloor \frac{\text{Max HP}}{25} \right\rfloor \times \left(1 + \frac{\text{NHPR\%}}{100}\right) \right\rfloor + \text{Flat NHPR} + 1$$

$$\text{Total NHPR} = \left\lfloor \text{Base NHPR} \times (1 + \text{Short Rest Lv} \times 0.05) \times \text{Emote} \times \text{Sunbath} \right\rfloor$$

Where:

- **Short Rest Lv** — level of the Short Rest passive skill (each level adds 5% regen)
- **Emote** — ×2.0 if emote HP regen boost is active, otherwise ×1.0
- **Sunbath** — ×1.5 if sunbathing, otherwise ×1.0

---

## 12. Natural MP Regen (NMPR)

$$\text{Base NMPR} = \left\lfloor \left\lfloor \frac{\text{Max MP}}{100} \right\rfloor \times \left(1 + \frac{\text{NMPR\%}}{100}\right) \right\rfloor + \text{Flat NMPR} + 1$$

$$\text{Total NMPR} = \left\lfloor \text{Base NMPR} \times (1 + \text{Short Rest Lv} \times 0.05) \times \text{Emote} \times \text{Sunbath} \right\rfloor$$

Same modifiers as NHPR apply.

---

## 13. Attack MP Recovery (AMPR)

$$\text{AMPR Base} = \left\lfloor 10 + \min\!\left(20,\ \frac{\text{Max MP}}{100}\right) \right\rfloor$$

$$\text{AMPR} = \left\lfloor \text{AMPR Base} \times \left(1 + \frac{\text{AMPR\%}}{100}\right) \right\rfloor + \text{Flat AMPR}$$

The MP-contribution to AMPR base is capped at +20 (reached at 2000 MP).

---

## 14. DEF & MDEF

$$\text{DEF Base} = \left\lfloor \text{Equipment Base DEF} + \text{Level} + \text{VIT} \right\rfloor$$

$$\text{DEF} = \left\lfloor \text{DEF Base} \times \left(1 + \frac{\text{DEF\%}}{100}\right) \right\rfloor + \text{Flat DEF}$$

$$\text{MDEF Base} = \left\lfloor \text{Equipment Base DEF} + \text{Level} + \text{INT} \right\rfloor$$

$$\text{MDEF} = \left\lfloor \text{MDEF Base} \times \left(1 + \frac{\text{MDEF\%}}{100}\right) \right\rfloor + \text{Flat MDEF}$$

Equipment Base DEF includes the armor's refine bonus.

---

## 15. Flee

$$\text{Flee Base} = \left\lfloor \text{Level} + \text{AGI} \right\rfloor$$

$$\text{Flee} = \left\lfloor \text{Flee Base} \times \left(1 + \frac{\text{Dodge\%}}{100}\right) \right\rfloor + \text{Flat Dodge}$$

---

## 16. Accuracy

$$\text{Acc Base} = \text{Level} + \text{DEX}$$

$$\text{Accuracy} = \left\lfloor \text{Acc Base} \times \left(1 + \frac{\text{ACC\%}}{100}\right) \right\rfloor + \text{Flat ACC}$$

---

## 17. Critical Rate

$$\text{Crit Base} = \left\lfloor 25 + \frac{\text{CRT}}{3.4} \right\rfloor$$

$$\text{Critical Rate} = \left\lfloor \text{Crit Base} \times \left(1 + \frac{\text{CR\%}}{100}\right) \right\rfloor + \text{Flat CR}$$

---

## 18. Critical Damage

The base formula depends on whether STR or AGI is higher:

$$\text{Crit Dmg Base} = \begin{cases} 150 + \dfrac{\text{STR}}{5} & \text{if STR} > \text{AGI} \\[6pt] 150 + \dfrac{\text{STR} + \text{AGI}}{10} & \text{if AGI} \geq \text{STR} \end{cases}$$

$$\text{Crit Dmg Raw} = \left\lfloor \text{Crit Dmg Base} \times \left(1 + \frac{\text{CD\%}}{100}\right) \right\rfloor + \text{Flat CD}$$

### Softcap at 300

$$\text{Critical Damage} = \begin{cases} \text{Crit Dmg Raw} & \text{if Raw} \leq 300 \\[4pt] 300 + \left\lfloor \dfrac{\text{Crit Dmg Raw} - 300}{2} \right\rfloor & \text{if Raw} > 300 \end{cases}$$

Above 300, every **2 raw Critical Damage = +1 effective Critical Damage**.

---

## 19. Magic Critical Rate

Magic Crit Rate is not a separate stat. It is converted from the physical Critical Rate via a conversion percentage:

$$\text{Magic Crit Rate} = \left\lfloor \text{Critical Rate} \times \frac{\text{MCR Conversion \%}}{100} \right\rfloor$$

**MCR Conversion % sources (all additive):**

| Source                                                       | Bonus                              |
| ------------------------------------------------------------ | ---------------------------------- |
| Spellburst passive (per level)                               | +2.5% per level (max +25% at lv10) |
| Non-awakened Staff or Magic Device with Neutral element      | +25%                               |
| Weaken ailment active on target                              | +50%                               |
| Dual Bringer lv10 buff active AND STR > INT (MW skills only) | +25%                               |

---

## 20. Magic Critical Damage

$$\text{Magic Crit Dmg} = \left\lfloor 100 + (\text{Critical Damage} - 100) \times \frac{\text{CD Ratio \%}}{100} \right\rfloor$$

**CD Ratio % sources (all additive):**

| Source                                                       | Bonus                              |
| ------------------------------------------------------------ | ---------------------------------- |
| Base                                                         | 50%                                |
| Spellburst passive (per level)                               | +2.5% per level (max +25% at lv10) |
| Dual Bringer lv10 buff active AND INT > STR (MW skills only) | +25%                               |

---

## 21. Hit Rate

$$\text{Hit Rate} = \min\!\left(100,\ \max\!\left(0,\ \left\lfloor 100 - \frac{\text{Enemy FLEE} - \text{Player ACC}}{3} + \frac{\text{Skill MP Cost}}{10} \right\rfloor \right)\right)$$

- When player ACC equals enemy FLEE: hit rate = 100%
- Every 3 points of enemy FLEE above player ACC: −1% hit rate
- Every 10 MP of skill cost: +1% hit rate (higher-cost skills are more precise)

When hit rate is below 100%, attacks that fail to connect become **Grazes** (reduced damage) rather than complete misses.

---

## 22. Damage Formula

The single-hit damage formula. All factors are chained and floored **once** at the end.

### Step 1 — Base Damage

$$\text{Base Damage} = \left\lfloor (\text{ATK float} + \text{Level} - \text{Enemy Level}) \times \left(1 - \frac{\text{Resist\%}}{100}\right) \times \left(1 - \frac{\text{Weapon Resist\%}}{100}\right) \right\rfloor$$

- **ATK float** — the un-floored ATK value (critical for accuracy)
- **Enemy Level** — higher enemy level directly reduces base damage
- **Resist%** — enemy's physical or magic resistance %
- **Weapon Resist%** — enemy's resistance specific to the weapon type

### Step 2 — Effective DEF

$$\text{Effective DEF} = \left\lfloor \text{Enemy DEF} \times \left(1 - \frac{\text{Pierce\%}}{100}\right) \right\rfloor$$

Pierce is **capped at 100%**. At 100% pierce, the enemy's DEF is fully ignored.

### Step 3 — Effective ATK

$$\text{Effective ATK} = \text{Base Damage} - \text{Effective DEF}$$

### Step 4 — Full Damage Chain

$$\text{Max Damage} = \left\lfloor \begin{aligned} &(\text{Effective ATK} + \text{Skill Constant}) \\ &\times \frac{\text{Skill Multiplier}}{100} \\ &\times \left(1 + \frac{\text{Active Buff}}{100}\right) \\ &\times \frac{\text{Proration}}{100} \\ &\times \left(1 + \frac{\text{Passive Buff}}{100}\right) \\ &\times \left(1 + \frac{\text{DTE} + \text{Element Stat}}{100}\right) \\ &\times \left(1 + \frac{\text{Zero Stance Lv}}{100}\right) \\ &\times \left(1 + \frac{\text{Range Damage}}{100}\right) \\ &\times \frac{\text{Combo Multiplier}}{100} \\ &\times \frac{\text{Critical Damage}}{100} \end{aligned} \right\rfloor$$

### Factor Explanations

| Factor                 | Description                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Skill Constant**     | Flat value added to Effective ATK before the multiplier. Varies by skill.                                            |
| **Skill Multiplier**   | Primary scaling of the skill. 100 = ×1.0 (auto attack). Skills range widely (e.g., 500–3000+).                       |
| **Active Buff**        | Damage buffs from active skills like Brave Aura or Concentration. Additive %.                                        |
| **Proration**          | Physical Proration = 250 (×2.5). Normal = 100 (×1.0). Applied to combo openers and standalone physical skills.       |
| **Passive Buff**       | Multiplicative bonus from passive skills like Sword Techniques. Additive %.                                          |
| **DTE + Element Stat** | Damage to Element (from equipment vs target element) + weapon Element stat. **Both are additive inside one factor.** |
| **Zero Stance Lv**     | Bonus when skill is used standalone (not in a combo chain). 0 when inside combo.                                     |
| **Range Damage**       | Short Range Damage % for melee skills, Long Range Damage % for ranged skills.                                        |
| **Combo Multiplier**   | 100 = no bonus (opener or standalone). 150 = Smite active (combo middle).                                            |
| **Critical Damage**    | Always applied — there is no crit/non-crit branch. All damage is treated as critical.                                |

> **Key rule:** Only ONE floor operation at the very end. No intermediate rounding anywhere in this chain.

---

## 23. Graze (Stability Damage Range)

Every hit produces a damage range based on Stability:

$$\text{Graze Min} = \left\lfloor 0.5 \times \frac{\text{Stability}}{100} \times \text{Max Damage} \right\rfloor$$

$$\text{Graze Max} = \text{Max Damage}$$

$$\text{Graze Average} = \left\lfloor \frac{\text{Graze Min} + \text{Graze Max}}{2} \right\rfloor$$

- At **100% Stability**: Graze Min = ⌊0.5 × Max Damage⌋
- At **50% Stability**: Graze Min = ⌊0.25 × Max Damage⌋

**Stability determines the damage floor, not a probability.** Every hit lands somewhere between Graze Min and Graze Max. Higher stability narrows this range toward Max Damage.

Attacks that fail the hit rate check (see [Section 21](#21-hit-rate)) become grazes rather than complete misses.

---

## 24. Per-Weapon Base Stat Contributions

### Stat ATK (contributed by stats, by weapon type)

| Weapon       | Stat ATK Formula  |
| ------------ | ----------------- |
| 1H Sword     | STR×2 + DEX×2     |
| 2H Sword     | STR×3 + DEX       |
| Bow          | STR + DEX×3       |
| Bowgun       | DEX×4             |
| Staff        | STR×3 + INT       |
| Magic Device | INT×2 + AGI×2     |
| Knuckles     | AGI×2 + DEX×0.5   |
| Halberd      | STR×2.5 + AGI×0.5 |
| Katana       | STR×1.5 + DEX×2.5 |
| Barehand     | DEX               |

### Stat MATK (contributed by stats, by weapon type)

| Weapon                                    | Stat MATK Formula |
| ----------------------------------------- | ----------------- |
| 1H Sword, 2H Sword, Bow, Bowgun, Barehand | INT×3 + DEX       |
| Staff, Magic Device, Knuckles             | INT×4 + DEX       |
| Halberd                                   | INT×2 + DEX + AGI |
| Katana                                    | INT×1.5 + DEX     |

> **Staff and Magic Device:** Weapon Base ATK is also added into Stat MATK, because their weapon base contributes to magic damage.

### Stability from Stats (by weapon type)

| Weapon       | Stability Stat Formula |
| ------------ | ---------------------- |
| 1H Sword     | STR×0.025 + DEX×0.075  |
| 2H Sword     | DEX×0.1                |
| Bow          | STR×0.05 + DEX×0.05    |
| Bowgun       | STR×0.05               |
| Staff        | STR×0.05               |
| Magic Device | DEX×0.1                |
| Knuckles     | DEX×0.025              |
| Halberd      | STR×0.05 + DEX×0.05    |
| Katana       | STR×0.075 + DEX×0.025  |
| Barehand     | 1 + DEX×0.35           |

### Stat ASPD (by weapon type)

| Weapon       | Stat ASPD Formula           | Weapon ASPD (flat) |
| ------------ | --------------------------- | ------------------ |
| 1H Sword     | STR×0.2 + AGI×4.2           | 100                |
| 2H Sword     | STR×0.2 + AGI×2.1           | 50                 |
| Bow          | DEX×0.2 + AGI×3.1           | 75                 |
| Bowgun       | DEX×0.2 + AGI×2.2           | 30                 |
| Staff        | INT×0.2 + AGI×1.8           | 60                 |
| Magic Device | INT×0.2 + AGI×4.0           | 90                 |
| Knuckles     | STR×0.1 + DEX×0.1 + AGI×4.6 | 120                |
| Halberd      | STR×0.2 + AGI×3.5           | 25                 |
| Katana       | STR×0.3 + AGI×3.9           | 200                |
| Barehand     | AGI×9.6                     | 1000               |

---

## 25. Sub-Weapon Rules

## no data yet

## 26. Elemental Effectiveness

When attacking with a weapon that has an element against a target that has an element +25% damage

fire -> earth -> wind -> water ->
light ->dark ->light (againts each other)

## 27. Difficulty Modifiers

Boss stats and effective level scale with difficulty setting:

| Difficulty | Stat Multiplier | Level Offset |
| ---------- | :-------------: | :----------: |
| Easy       |      ×0.1       |     −10      |
| Normal     |      ×1.0       |      ±0      |
| Hard       |      ×2.0       |     +10      |
| Nightmare  |      ×4.0       |     +20      |
| Ultimate   |      ×6.0       |     +40      |

- **Stat Multiplier** applies to boss HP, DEF, and other stats
- **Level Offset** is added to the boss's base level, directly reducing Base Damage in the damage formula (higher enemy level = less damage dealt)
