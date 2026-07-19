# Toram Item Database — Data Schema

## 1. `items.json`

Array of item objects. Each item:

```jsonc
{
	"name": "Ancient Coin", // string — item display name
	"id": "1", // string — numeric ID from coryn.club
	"url": "https://coryn.club/item.php?id=1", // string — source URL
	"type": "Material", // string — see §2 Item Types below

	"sell": "7 Spina", // "N Spina" | "0 Spina" | "Unknown"
	"process": "7 Metal", // "N Metal|Cloth|Beast|Wood|Medicine|Mana" | "N/A" | "unknown"

	"stats": {
		"general": {
			// Record<string, string>
			"ATK": "2", //   key → value (stat label → amount)
			"MP": "10"
		},
		"exclusive": [
			// array — conditions + slot-adds (piercer items)
			{
				"condition": "1-Handed Sword",
				"stats": {
					"Adds 1 slot to a 0-slotted One-Hand Sword": "1"
				}
			}
		]
	},

	"drops": [
		// array — monster drop sources
		{ "monster": "Gold Jelly(Lv 34)", "map": "Aulada Ancient Tower" }
	],

	"recipe": {
		// {} if uncraftable
		"fee": "150", //   optional — craft fee (Spina)
		"materials": [
			//   array of material lines
			"- 10xHematite",
			"- 5x Mana"
		]
	},

	"used_for": {
		"crafting": [
			// items this is used to craft
			"Ring of Greed(1 pcs/craft)" //   format: "ItemName(N pcs/craft)"
		],
		"upgrade_into": [
			// items this can upgrade into
			"Seraph Machina" //   just item name
		]
	}
}
```

---

## 2. Item Types (`src/lib/constant/item-types.js`)

```js
itemTypes.oneHandedSword   → "1 Handed Sword"
itemTypes.shield           → "Shield"
itemTypes.ninjutsuScroll   → "Ninjutsu Scroll"
itemTypes.dagger           → "Dagger"
itemTypes.additional       → "Additional"
itemTypes.armor            → "Armor"
itemTypes.special          → "Special"
// … 35 entries total
```

### Categories (from `typeCategory` / `categories`)

| Category       | Types included                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **weapon**     | 1 Handed Sword, 2 Handed Sword, Bow, Bowgun, Staff, Magic Device, Knuckles, Halberd, Katana, Arrow                            |
| **armor**      | Armor                                                                                                                         |
| **subWeapon**  | Shield, Ninjutsu Scroll, Dagger                                                                                               |
| **additional** | Additional                                                                                                                    |
| **special**    | Special                                                                                                                       |
| **crysta**     | Normal Crysta, Weapon Crysta, Armor Crysta, Additional Crysta, Special Crysta, Enhancer Crysta (Blue/Green/Purple/Red/Yellow) |
| **material**   | Material, Ore, Gem                                                                                                            |
| **consumable** | Usable, Refinement Support, Piercer, Registlet                                                                                |
| **other**      | Unknown                                                                                                                       |

Usage:

```js
import { itemTypes, typeCategory } from '$lib/constant/item-types';

itemTypes.armorCrysta; // → "Armor Crysta"
typeCategory['Armor Crysta']; // → "crysta"
```

---

## 3. Stat Keys (`src/lib/constant/stat-keys.js`)

### `statKeys` — general stats registry

187 entries mapping camelCase → original label:

```js
statKeys.atk; // → "ATK"
statKeys.atkPercent; // → "ATK %"
statKeys.maxHp; // → "MaxHP"
statKeys.criticalRate; // → "Critical Rate"
statKeys.aspd; // → "ASPD"
statKeys.cspd; // → "CSPD"
statKeys.str; // → "STR"
statKeys.int; // → "INT"
statKeys.vit; // → "VIT"
statKeys.agi; // → "AGI"
statKeys.dex; // → "DEX"
statKeys.percentStrongerAgainstDark; // → "% stronger against Dark"
statKeys.teleportToSofyaCity; // → "Teleport to Sofya City"
statKeys.learnNinjaSkillLv1; // → "Learn Ninja Skill Lv1"
// … 187 entries
```

Helper exports:

- `allStatKeys` — array of original labels
- `allStatKeyNames` — array of camelCase keys

### `exclusiveConditions` — piercer condition labels

24 entries, aligned with `itemTypes` keys where possible:

| CamelCase key       | Original label      |
| ------------------- | ------------------- |
| `oneHandedSword`    | 1-Handed Sword      |
| `twoHandedSword`    | 2-Handed Sword      |
| `knuckles`          | Knuckle             |
| `additional`        | Additional Gear     |
| `special`           | Special Gear        |
| `heavyArmor`        | Heavy Armor         |
| `lightArmor`        | Light Armor         |
| `dualSwords`        | Dual Swords         |
| `magicDeviceDagger` | Magic Device,Dagger |
| `bowgunBow`         | Bowgun,Bow          |
| `event`             | Event               |

### `exclusiveKeys` — keys found in `stats.exclusive[].stats`

83 entries (subset of `statKeys` + slot-add keys like `"Adds 1 slot to a 0-slotted One-Hand Sword"`).

---

## 4. Field Semantics

| Field                   | Meaning                                                   | Format                                                |
| ----------------------- | --------------------------------------------------------- | ----------------------------------------------------- | ----- | ----- | ---- | -------- | ---------------------------- |
| `sell`                  | NPC sell price                                            | `"<number> Spina"` or `"Unknown"` / `"0 Spina"`       |
| `process`               | Process material for synthesist profession                | `"<number> <Metal                                     | Cloth | Beast | Wood | Medicine | Mana>"`or`"N/A"`/`"unknown"` |
| `stats.general`         | All stat bonuses the item provides                        | `{ "Stat Label": "value" }` — value is always string  |
| `stats.exclusive`       | Condition-scoped slot adds (piercer type items only)      | Array of `{ condition, stats }`                       |
| `recipe`                | Player-craftable recipe                                   | `{ fee?, materials[] }` — empty `{}` if not craftable |
| `used_for.crafting`     | List of items this is an ingredient for                   | `"ItemName(N pcs/craft)"`                             |
| `used_for.upgrade_into` | Items that consume this to upgrade (crysta upgrade paths) | Plain item name strings                               |
| `drops[].monster`       | Monster name + level                                      | `"Name(Lv N)"`                                        |
| `drops[].map`           | Map name the monster is found in                          | Plain string                                          |

---

## 5. Quick Reference

```js
// Import helpers
import { itemTypes, typeCategory, categories, categoryTypes } from '$lib/constant/item-types';
import { statKeys, exclusiveConditions, exclusiveKeys } from '$lib/constant/stat-keys';

// Find category for a type
typeCategory[item.type]; // → "weapon" | "crysta" | …

// Check if stat exists in general
statKeys.atkPercent in item.stats.general; // → true/false

// Resolve condition label
exclusiveConditions.knuckles; // → "Knuckle"
```
