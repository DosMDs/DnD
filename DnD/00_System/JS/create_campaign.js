module.exports = async (tp) => {
  const app = tp.app;
  const vault = app.vault;
  const helpers = tp.user.dnd_helpers;
  const campaignsRoot = "02_Campaigns";

  const campaignTitle = await tp.system.prompt("Название кампании:");
  if (!campaignTitle) {
    new Notice("Создание кампании отменено: не указано название.");
    return;
  }

  const shortCodeInput = await tp.system.prompt(
    "Короткий код кампании (например COS):",
    "",
  );
  const systemInput = await tp.system.prompt("Система:", "DND5e");
  const roleInput = await tp.system.prompt("Роль:", "player");
  const dmInput = await tp.system.prompt("DM:", "");
  const statusInput = await tp.system.prompt("Статус кампании:", "active");
  const startDate = tp.date.now("YYYY-MM-DD");

  const rootFolder = vault.getAbstractFileByPath(campaignsRoot);
  if (!rootFolder || !rootFolder.children) {
    new Notice(`Папка ${campaignsRoot} не найдена.`);
    return;
  }

  const existingIds = rootFolder.children
    .filter((f) => f.children && /^\d{3}_Campaign$/.test(f.name))
    .map((f) => Number(f.name.slice(0, 3)))
    .filter((n) => !Number.isNaN(n));

  const nextId = existingIds.length ? Math.max(...existingIds) + 1 : 1;
  const paddedId = String(nextId).padStart(3, "0");
  const folderName = `${paddedId}_Campaign`;
  const campaignFolderPath = `${campaignsRoot}/${folderName}`;

  const subfolders = [
    "Sessions",
    "Logs",
    "Quests",
    "NPCs",
    "Locations",
    "Players",
    "Items",
    "Assets",
  ];

  await vault.createFolder(campaignFolderPath);

  for (const subfolder of subfolders) {
    await vault.createFolder(`${campaignFolderPath}/${subfolder}`);
  }

  const campaignFilePath = `${campaignFolderPath}/Campaign.md`;
  const defaultWorldState = helpers.getDefaultHarptosState();

  const campaignContent = `---
type: campaign
campaign_id: ${nextId}
folder_key: ${folderName}
title: ${campaignTitle}
aliases:
  - ${campaignTitle}
short_code: ${shortCodeInput || ""}
status: ${statusInput || "active"}
system: ${systemInput || "DND5e"}
role: ${roleInput || "player"}
start_date: ${startDate}
current_arc:
dm: ${dmInput || ""}
last_session_no:
last_session_date:
calendar_system: harptos
world_year: ${defaultWorldState.world_year}
world_month_key: ${defaultWorldState.world_month_key}
world_month_label: ${defaultWorldState.world_month_label}
world_day: ${defaultWorldState.world_day}
world_hour: ${defaultWorldState.world_hour}
world_total_hours: ${defaultWorldState.world_total_hours}
world_date_label: "${defaultWorldState.world_date_label}"
world_day_delta: 0
world_hour_delta: 0
tags:
  - dnd
  - campaign
created: ${startDate}
updated: ${startDate}
---
# \`VIEW[{title}]\`

## Общая информация

- **Название:** \`INPUT[text:title]\`
- **Короткий код:** \`INPUT[text:short_code]\`
- **Система:** \`INPUT[text:system]\`
- **Статус:** \`INPUT[inlineSelect(option(active), option(paused), option(completed), option(archived)):status]\`
- **Роль:** \`INPUT[text:role]\`
- **DM:** \`INPUT[text:dm]\`
- **Текущая арка:** \`INPUT[textArea:current_arc]\`
- **Дата старта:** \`INPUT[date:start_date]\`
- **Последняя сессия №:** \`VIEW[{last_session_no}]\`
- **Дата последней сессии:** \`VIEW[{last_session_date}]\`
- **Календарь:** \`VIEW[{calendar_system}]\`
- **Игровая дата:** \`VIEW[{world_date_label}]\`

> [!actions] ОСНОВНЫЕ ДЕЙСТВИЯ
> \`\`\`meta-bind-button
> label: Новая сессия
> icon: calendar-plus
> style: primary
> class: dnd-action-button dnd-action-session
> action:
>   type: runTemplaterFile
>   templateFile: "00_System/Templates/System/Create Session.md"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Новый квест
> icon: scroll-text
> style: primary
> class: dnd-action-button dnd-action-quest
> action:
>   type: runTemplaterFile
>   templateFile: "00_System/Templates/System/Create Quest.md"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Новый NPC
> icon: users
> style: primary
> class: dnd-action-button dnd-action-npc
> action:
>   type: runTemplaterFile
>   templateFile: "00_System/Templates/System/Create NPC.md"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Новая локация
> icon: map-pinned
> style: primary
> class: dnd-action-button dnd-action-location
> action:
>   type: runTemplaterFile
>   templateFile: "00_System/Templates/System/Create Location.md"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Новый лог
> icon: notebook-pen
> style: primary
> class: dnd-action-button dnd-action-log
> action:
>   type: runTemplaterFile
>   templateFile: "00_System/Templates/System/Create Log.md"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Новый предмет
> icon: package
> style: primary
> class: dnd-action-button dnd-action-item
> action:
>   type: runTemplaterFile
>   templateFile: "00_System/Templates/System/Create Item.md"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Новый персонаж
> icon: shield
> style: primary
> class: dnd-action-button dnd-action-player
> action:
>   type: runTemplaterFile
>   templateFile: "00_System/Templates/System/Create Player.md"
> \`\`\`

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

\`BUTTON[campaign-set-active, campaign-set-paused, campaign-set-completed, campaign-set-archived]\`
\`BUTTON[campaign-aliases-sync]\`

\`\`\`meta-bind-button
id: campaign-set-active
label: Сделать активной
icon: play
style: primary
hidden: true
action:
  type: updateMetadata
  bindTarget: status
  evaluate: false
  value: active
\`\`\`

\`\`\`meta-bind-button
id: campaign-set-paused
label: Поставить на паузу
icon: pause
style: default
hidden: true
action:
  type: updateMetadata
  bindTarget: status
  evaluate: false
  value: paused
\`\`\`

\`\`\`meta-bind-button
id: campaign-set-completed
label: Завершить
icon: check
style: primary
hidden: true
action:
  type: updateMetadata
  bindTarget: status
  evaluate: false
  value: completed
\`\`\`

\`\`\`meta-bind-button
id: campaign-set-archived
label: Архивировать
icon: archive
style: destructive
hidden: true
action:
  type: updateMetadata
  bindTarget: status
  evaluate: false
  value: archived
\`\`\`

\`\`\`meta-bind-button
id: campaign-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
\`\`\`

## Игровое время

- **Текущая дата Харптоса:** \`VIEW[{world_date_label}]\`
- **Сдвиг дней:** \`INPUT[number:world_day_delta]\` \`BUTTON[campaign-edit-day]\`
- **Сдвиг часов:** \`INPUT[number:world_hour_delta]\` \`BUTTON[campaign-edit-time]\`

\`\`\`meta-bind-button
id: campaign-edit-day
label: Изменить день
icon: calendar-sync
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/edit_campaign_day.js"
\`\`\`

\`\`\`meta-bind-button
id: campaign-edit-time
label: Изменить время
icon: clock-3
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/edit_campaign_time.js"
\`\`\`

## Сессии

\`\`\`dataview
TABLE WITHOUT ID
  link(file.path, title) as "Сессия",
  session_no as "№",
  date as "Дата",
  status as "Статус"
FROM "${campaignFolderPath}/Sessions"
WHERE type = "session"
SORT session_no DESC
\`\`\`

## Квесты

### Активные квесты

\`\`\`dataview
TABLE WITHOUT ID
  link(file.path, title) as "Квест",
  priority as "Приоритет",
  opened_in_session as "Открыт в сессии"
FROM "${campaignFolderPath}/Quests"
WHERE type = "quest" AND status = "active"
SORT entity_id ASC
\`\`\`

### Все квесты

\`\`\`dataview
TABLE WITHOUT ID
  link(file.path, title) as "Квест",
  status as "Статус",
  priority as "Приоритет"
FROM "${campaignFolderPath}/Quests"
WHERE type = "quest"
SORT entity_id ASC
\`\`\`

## NPC

\`\`\`dataview
TABLE WITHOUT ID
  link(file.path, title) as "NPC",
  status as "Статус",
  home_location as "Дом",
  last_seen as "Последняя встреча"
FROM "${campaignFolderPath}/NPCs"
WHERE type = "npc"
SORT entity_id ASC
\`\`\`

## Локации

\`\`\`dataview
TABLE WITHOUT ID
  link(file.path, title) as "Локация",
  status as "Статус",
  region as "Регион",
  last_visited as "Последнее посещение"
FROM "${campaignFolderPath}/Locations"
WHERE type = "location"
SORT entity_id ASC
\`\`\`

## Персонажи игроков

\`\`\`dataview
TABLE WITHOUT ID
  link(file.path, title) as "Персонаж",
  player_name as "Игрок",
  class as "Класс",
  level as "Уровень",
  status as "Статус"
FROM "${campaignFolderPath}/Players"
WHERE type = "player_character"
SORT entity_id ASC
\`\`\`

## Предметы

\`\`\`dataview
TABLE WITHOUT ID
  link(file.path, title) as "Предмет",
  status as "Статус",
  holder as "Владелец"
FROM "${campaignFolderPath}/Items"
WHERE type = "item"
SORT entity_id ASC
\`\`\`

## Последние логи

\`\`\`dataview
TABLE WITHOUT ID
  date as "Дата",
  link(file.path, title) as "Лог",
  session_ref as "Сессия",
  status as "Статус"
FROM "${campaignFolderPath}/Logs"
WHERE type = "log"
SORT date DESC
LIMIT 10
\`\`\`
`;

  const createdFile = await vault.create(campaignFilePath, campaignContent);
  await app.workspace.getLeaf(true).openFile(createdFile);

  new Notice(`Кампания ${folderName} создана.`);
};
