module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const playersFolderPath = `${ctx.campaignFolderPath}/Players`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      playersFolderPath,
      /^\d{3}_Player\.md$/,
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_Player.md`;
    const filePath = `${playersFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    // ── Ввод базовых данных ───────────────────────────────────────────────────
    const titleInput = await tp.system.prompt("Имя персонажа:", `Персонаж ${nextId}`);
    if (!titleInput) { new Notice("Создание отменено."); return; }

    const playerNameInput  = await tp.system.prompt("Имя игрока:", "");
    const raceInput        = await tp.system.prompt("Раса:", "Human");
    const classInput       = await tp.system.prompt("Класс:", "Fighter");
    const subclassInput    = await tp.system.prompt("Подкласс (можно пустым):", "");
    const backgroundInput  = await tp.system.prompt("Предыстория:", "");
    const levelInput       = await tp.system.prompt("Уровень:", "1");
    const alignmentInput   = await tp.system.prompt("Мировоззрение:", "Нейтральный");
    const partyRoleInput   = await tp.system.prompt("Роль в партии (tank/support/damage/control/utility):", "");

    const level  = parseInt(levelInput) || 1;
    // Бонус мастерства по уровню
    const profBonus = level < 5 ? 2 : level < 9 ? 3 : level < 13 ? 4 : level < 17 ? 5 : 6;

    const today = tp.date.now("YYYY-MM-DD");

    // ── Генерируем полный чар-лист ────────────────────────────────────────────
    const content = `---
type: player_character
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${titleInput}
aliases:
  - ${titleInput}
player_name: ${playerNameInput || ""}
race: ${raceInput || ""}
class: ${classInput || ""}
subclass: ${subclassInput || ""}
background: ${backgroundInput || ""}
level: ${level}
experience: 0
alignment: ${alignmentInput || ""}
party_role: ${partyRoleInput || ""}
is_active: true
status: active

# ── Характеристики ───────────────────────────────────────────────────────────
str: 10
dex: 10
con: 10
int: 10
wis: 10
cha: 10

# ── Боевые параметры ─────────────────────────────────────────────────────────
armor_class: 10
initiative: 0
speed: 30
hp_max: 10
hp_current: 10
hp_temp: 0
hit_dice_total: ${level}
hit_dice_current: ${level}
hit_dice_type: d10
proficiency_bonus: ${profBonus}
death_saves_success: 0
death_saves_failure: 0

# ── Спасброски (proficiency: true/false) ─────────────────────────────────────
save_str_prof: false
save_dex_prof: false
save_con_prof: false
save_int_prof: false
save_wis_prof: false
save_cha_prof: false

# ── Навыки (proficiency: 0=none, 1=prof, 2=expertise) ────────────────────────
skill_acrobatics: 0
skill_animal_handling: 0
skill_arcana: 0
skill_athletics: 0
skill_deception: 0
skill_history: 0
skill_insight: 0
skill_intimidation: 0
skill_investigation: 0
skill_medicine: 0
skill_nature: 0
skill_perception: 0
skill_performance: 0
skill_persuasion: 0
skill_religion: 0
skill_sleight_of_hand: 0
skill_stealth: 0
skill_survival: 0
passive_perception: 10

# ── Ячейки заклинаний ────────────────────────────────────────────────────────
spell_ability: "none"
spell_save_dc: 0
spell_attack_bonus: 0
slot_1_max: 0
slot_1_current: 0
slot_2_max: 0
slot_2_current: 0
slot_3_max: 0
slot_3_current: 0
slot_4_max: 0
slot_4_current: 0
slot_5_max: 0
slot_5_current: 0
slot_6_max: 0
slot_6_current: 0
slot_7_max: 0
slot_7_current: 0
slot_8_max: 0
slot_8_current: 0
slot_9_max: 0
slot_9_current: 0

# ── Кошелёк ──────────────────────────────────────────────────────────────────
coin_cp: 0
coin_sp: 0
coin_ep: 0
coin_gp: 0
coin_pp: 0

# ── Вдохновение и особое ─────────────────────────────────────────────────────
inspiration: false
exhaustion: 0
conditions: ""

tags:
  - dnd
  - player
created: ${today}
updated: ${today}
---

# \`VIEW[{title}]\` — \`VIEW[{race}]\` \`VIEW[{class}]\` \`VIEW[{level}]\` ур.

> Кампания: [[${ctx.campaignFilePath.replace(/\.md$/, "")}|${ctx.campaignTitle}]] | Игрок: \`VIEW[{player_name}]\`

> [!actions-row] СТАТУС ПЕРСОНАЖА
> \`\`\`meta-bind-button
> label: Активен
> icon: shield-check
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/set_player_active.js"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Неактивен
> icon: pause
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: inactive
> \`\`\`
>
> \`\`\`meta-bind-button
> label: На покое
> icon: archive
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: retired
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Мёртв
> icon: skull
> style: destructive
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: dead
> \`\`\`

---

## ⚔️ Боевые параметры

> [!actions-row] ХИТЫ
> \`\`\`meta-bind-button
> label: "-1 HP"
> icon: heart-crack
> style: destructive
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/player_hp_change.js"
>   args:
>     delta: -1
> \`\`\`
>
> \`\`\`meta-bind-button
> label: "+1 HP"
> icon: heart-plus
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/player_hp_change.js"
>   args:
>     delta: 1
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Полное лечение
> icon: heart-pulse
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/player_hp_full_heal.js"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Длинный отдых
> icon: moon
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/player_long_rest.js"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Короткий отдых
> icon: coffee
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/player_short_rest.js"
> \`\`\`

| Параметр | Значение |
|---|---|
| **КД** | \`INPUT[number:armor_class]\` |
| **Инициатива** | \`INPUT[number:initiative]\` |
| **Скорость** | \`INPUT[number:speed]\` фут. |
| **Бонус мастерства** | \`INPUT[number:proficiency_bonus]\` |
| **Пассивное восприятие** | \`INPUT[number:passive_perception]\` |
| **Вдохновение** | \`INPUT[toggle:inspiration]\` |
| **Истощение** | \`INPUT[number:exhaustion]\` (0–6) |
| **Состояния** | \`INPUT[text:conditions]\` |

### Хиты

| | |
|---|---|
| **Макс. HP** | \`INPUT[number:hp_max]\` |
| **Текущие HP** | \`INPUT[number:hp_current]\` |
| **Временные HP** | \`INPUT[number:hp_temp]\` |

\`VIEW[{hp_current}]\` / \`VIEW[{hp_max}]\` + \`VIEW[{hp_temp}]\` врем.

\`\`\`meta-bind
INPUT[progressBar(minValue(0), maxValue(100), stepSize(1)):hp_current]
\`\`\`

### Кости хитов

| Тип | Всего | Осталось |
|---|---|---|
| \`INPUT[text:hit_dice_type]\` | \`INPUT[number:hit_dice_total]\` | \`INPUT[number:hit_dice_current]\` |

### Спасброски смерти

Успехи: \`INPUT[number:death_saves_success]\` / 3 &nbsp;&nbsp; Провалы: \`INPUT[number:death_saves_failure]\` / 3

---

## 📊 Характеристики

| Характеристика | Значение | Модификатор | Спасбросок |
|---|---|---|---|
| **СИЛ** | \`INPUT[number:str]\` | \`VIEW[floor(({str}-10)/2)]\` | \`INPUT[toggle:save_str_prof]\` |
| **ЛОВ** | \`INPUT[number:dex]\` | \`VIEW[floor(({dex}-10)/2)]\` | \`INPUT[toggle:save_dex_prof]\` |
| **ТЕЛ** | \`INPUT[number:con]\` | \`VIEW[floor(({con}-10)/2)]\` | \`INPUT[toggle:save_con_prof]\` |
| **ИНТ** | \`INPUT[number:int]\` | \`VIEW[floor(({int}-10)/2)]\` | \`INPUT[toggle:save_int_prof]\` |
| **МДР** | \`INPUT[number:wis]\` | \`VIEW[floor(({wis}-10)/2)]\` | \`INPUT[toggle:save_wis_prof]\` |
| **ХАР** | \`INPUT[number:cha]\` | \`VIEW[floor(({cha}-10)/2)]\` | \`INPUT[toggle:save_cha_prof]\` |

> Модификаторы рассчитываются автоматически: \`floor((значение - 10) / 2)\`

---

## 🎯 Навыки

> 0 = нет владения · 1 = владение · 2 = сверхвладение

| Навык (хар-ка) | Владение |
|---|---|
| Акробатика (ЛОВ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_acrobatics]\` |
| Анализ (ИНТ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_investigation]\` |
| Атлетика (СИЛ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_athletics]\` |
| Выживание (МДР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_survival]\` |
| Выступление (ХАР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_performance]\` |
| Запугивание (ХАР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_intimidation]\` |
| История (ИНТ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_history]\` |
| Insight (МДР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_insight]\` |
| Ловкость рук (ЛОВ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_sleight_of_hand]\` |
| Магия (ИНТ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_arcana]\` |
| Медицина (МДР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_medicine]\` |
| Обман (ХАР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_deception]\` |
| Природа (ИНТ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_nature]\` |
| Религия (ИНТ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_religion]\` |
| Скрытность (ЛОВ) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_stealth]\` |
| Уход за животными (МДР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_animal_handling]\` |
| Убеждение (ХАР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_persuasion]\` |
| Восприятие (МДР) | \`INPUT[inlineSelect(option(0,—), option(1,✦), option(2,✦✦)):skill_perception]\` |

---

## ✨ Заклинания

- **Базовая характеристика:** \`INPUT[inlineSelect(option(none,—), option(int,ИНТ), option(wis,МДР), option(cha,ХАР)):spell_ability]\`
- **Сложность спасброска:** \`INPUT[number:spell_save_dc]\`
- **Бонус атаки заклинанием:** \`INPUT[number:spell_attack_bonus]\`

### Ячейки заклинаний

| Уровень | Макс | Текущие | Потрачено |
|---|---|---|---|
| 1-й | \`INPUT[number:slot_1_max]\` | \`INPUT[number:slot_1_current]\` | \`BUTTON[slot-1-use]\` |
| 2-й | \`INPUT[number:slot_2_max]\` | \`INPUT[number:slot_2_current]\` | \`BUTTON[slot-2-use]\` |
| 3-й | \`INPUT[number:slot_3_max]\` | \`INPUT[number:slot_3_current]\` | \`BUTTON[slot-3-use]\` |
| 4-й | \`INPUT[number:slot_4_max]\` | \`INPUT[number:slot_4_current]\` | \`BUTTON[slot-4-use]\` |
| 5-й | \`INPUT[number:slot_5_max]\` | \`INPUT[number:slot_5_current]\` | \`BUTTON[slot-5-use]\` |
| 6-й | \`INPUT[number:slot_6_max]\` | \`INPUT[number:slot_6_current]\` | \`BUTTON[slot-6-use]\` |
| 7-й | \`INPUT[number:slot_7_max]\` | \`INPUT[number:slot_7_current]\` | \`BUTTON[slot-7-use]\` |
| 8-й | \`INPUT[number:slot_8_max]\` | \`INPUT[number:slot_8_current]\` | \`BUTTON[slot-8-use]\` |
| 9-й | \`INPUT[number:slot_9_max]\` | \`INPUT[number:slot_9_current]\` | \`BUTTON[slot-9-use]\` |

\`\`\`meta-bind-button
id: slot-1-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 1
\`\`\`

\`\`\`meta-bind-button
id: slot-2-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 2
\`\`\`

\`\`\`meta-bind-button
id: slot-3-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 3
\`\`\`

\`\`\`meta-bind-button
id: slot-4-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 4
\`\`\`

\`\`\`meta-bind-button
id: slot-5-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 5
\`\`\`

\`\`\`meta-bind-button
id: slot-6-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 6
\`\`\`

\`\`\`meta-bind-button
id: slot-7-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 7
\`\`\`

\`\`\`meta-bind-button
id: slot-8-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 8
\`\`\`

\`\`\`meta-bind-button
id: slot-9-use
label: "-1"
icon: zap
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_use_spell_slot.js"
  args:
    slot: 9
\`\`\`

### Список заклинаний

<!-- Пример строки: | Огненный шар | 3 | Эвок. | Конц. | 150 фут. | -->
| Заклинание | Ур. | Школа | Конц. | Дистанция |
|---|---|---|---|---|
|  |  |  |  |  |

---

## 💰 Кошелёк

| Монеты | Количество | Значение (gp) |
|---|---|---|
| 🟤 Медные (cp) | \`INPUT[number:coin_cp]\` | \`VIEW[{coin_cp} * 0.01]\` |
| ⚪ Серебряные (sp) | \`INPUT[number:coin_sp]\` | \`VIEW[{coin_sp} * 0.1]\` |
| 🔵 Электрум (ep) | \`INPUT[number:coin_ep]\` | \`VIEW[{coin_ep} * 0.5]\` |
| 🟡 Золотые (gp) | \`INPUT[number:coin_gp]\` | \`VIEW[{coin_gp}]\` |
| ⚪ Платиновые (pp) | \`INPUT[number:coin_pp]\` | \`VIEW[{coin_pp} * 10]\` |
| **Итого (gp)** | | \`VIEW[{coin_cp} * 0.01 + {coin_sp} * 0.1 + {coin_ep} * 0.5 + {coin_gp} + {coin_pp} * 10]\` |

> [!actions-row] КОШЕЛЁК
> \`\`\`meta-bind-button
> label: Получить монеты
> icon: plus-circle
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/player_wallet_add.js"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Потратить монеты
> icon: minus-circle
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/player_wallet_spend.js"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Конвертировать
> icon: refresh-cw
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/player_wallet_convert.js"
> \`\`\`

---

## 🎒 Снаряжение

### Оружие

| Оружие | Бонус атаки | Урон | Тип |
|---|---|---|---|
|  |  |  |  |

### Броня и щит

| Предмет | КД | Особенности |
|---|---|---|
|  |  |  |

### Инвентарь

<!-- Ссылки на карточки предметов: [[путь/к/предмету|Название]] -->

---

## 📜 Черты и способности

### Черты расы

### Черты класса

### Умения и языки

**Доспехи:** 
**Оружие:** 
**Инструменты:** 
**Языки:** 

---

## 🧬 Личность

- **Мировоззрение:** \`INPUT[text:alignment]\`
- **Предыстория:** \`INPUT[text:background]\`

### Черты характера

### Идеалы

### Привязанности

### Слабости

### Внешность

---

## 📖 История персонажа

---

## 🔗 Связи

### Активные квесты

\`\`\`dataview
TABLE WITHOUT ID file.link as "Квест", status as "Статус"
FROM "${ctx.campaignFolderPath}/Quests"
WHERE type = "quest" AND status = "active"
SORT entity_id ASC
\`\`\`

### Связанные NPC

---

##### СЛУЖЕБНЫЕ ДЕЙСТВИЯ

\`BUTTON[player-aliases-sync, player-level-up]\`

\`\`\`meta-bind-button
id: player-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
\`\`\`

\`\`\`meta-bind-button
id: player-level-up
label: Повышение уровня
icon: trending-up
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/player_level_up.js"
\`\`\`
`;

    const playersFolder = ctx.vault.getAbstractFileByPath(playersFolderPath);
    if (!playersFolder) await ctx.vault.createFolder(playersFolderPath);

    const createdFile = await ctx.vault.create(filePath, content);

    // Деактивируем остальных персонажей игрока в кампании
    const allPlayers = ctx.vault.getMarkdownFiles()
      .filter(f => f.path.startsWith(`${playersFolderPath}/`) && /^\d{3}_Player\.md$/.test(f.name));
    for (const pf of allPlayers) {
      if (pf.path !== filePath) {
        await ctx.app.fileManager.processFrontMatter(pf, fm => { fm.is_active = false; });
      }
    }

    await ctx.app.workspace.getLeaf(true).openFile(createdFile);
    new Notice(`Персонаж ${titleInput} создан и установлен активным.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания персонажа.");
    console.error(error);
  }
};
