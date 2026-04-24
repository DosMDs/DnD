module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const locationsFolderPath = `${ctx.campaignFolderPath}/Locations`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      locationsFolderPath,
      /^\d{3}_Location\.md$/,
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_Location.md`;
    const filePath = `${locationsFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    const locationTitleInput = await tp.system.prompt(
      "Название локации:",
      `Локация ${nextId}`,
    );
    if (!locationTitleInput) {
      new Notice("Создание локации отменено: не указано название.");
      return;
    }

    const statusInput = await tp.system.prompt("Статус локации:", "known");
    const parentLocationInput = await tp.system.prompt(
      "Родительская локация (например 001_Location, можно оставить пустым):",
      "",
    );
    const regionInput = await tp.system.prompt("Регион:", "");

    const today = tp.date.now("YYYY-MM-DD");

    const parentLocation = helpers.buildLocationDisplayLink(
      ctx.app,
      ctx.vault,
      ctx.campaignFolderPath,
      parentLocationInput,
    );

    const npcsFolderPath = `${ctx.campaignFolderPath}/NPCs`;
    const questsFolderPath = `${ctx.campaignFolderPath}/Quests`;
    const logsFolderPath = `${ctx.campaignFolderPath}/Logs`;

    const content = `---
type: location
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${locationTitleInput}
aliases:
  - ${locationTitleInput}
status: ${statusInput || "known"}
parent_location: ${parentLocation ? `"${parentLocation}"` : ""}
region: ${regionInput || ""}
last_visited:
related_npcs:
related_quests:
tags:
  - dnd
  - location
created: ${today}
updated: ${today}
---
# \`VIEW[{title}]\`

> Кампания: [[${ctx.campaignFilePath.replace(/\\.md$/, "")}|${ctx.campaignTitle}]]

> [!actions-row] ОСНОВНЫЕ ДЕЙСТВИЯ
> \`\`\`meta-bind-button
> label: Известна
> icon: map
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: known
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Посещена
> icon: map-pinned
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/mark_location_visited_in_last_session.js"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Скрыта
> icon: eye-off
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: hidden
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Закрыта
> icon: lock
> style: destructive
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: closed
> \`\`\`

## Общая информация

- **Название:** \`INPUT[text:title]\`
- **Статус:** \`INPUT[inlineSelect(option(known), option(hidden), option(closed)):status]\`
- **Родительская локация:** \`VIEW[{parent_location}][text(renderMarkdown)]\`
- **Регион:** \`INPUT[text:region]\`
- **Последнее посещение:** \`VIEW[{last_visited}][text(renderMarkdown)]\`

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

\`BUTTON[location-edit-parent, location-aliases-sync]\`

\`\`\`meta-bind-button
id: location-edit-parent
label: Изменить род. локацию
icon: map
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/edit_parent_location_for_location.js"
\`\`\`

\`\`\`meta-bind-button
id: location-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
\`\`\`

## Описание

## Что известно

## Связи

### Дочерние локации

\`\`\`dataview
TABLE WITHOUT ID
  file.link as "Локация",
  status as "Статус",
  region as "Регион"
FROM "${locationsFolderPath}"
WHERE type = "location" AND parent_location = this.file.link
SORT entity_id ASC
\`\`\`

### NPC, для которых это домашняя локация

\`\`\`dataview
TABLE WITHOUT ID
  file.link as "NPC",
  status as "Статус",
  role_in_story as "Роль"
FROM "${npcsFolderPath}"
WHERE type = "npc" AND home_location = this.file.link
SORT entity_id ASC
\`\`\`

### Квесты, связанные с этой локацией

\`\`\`dataview
TABLE WITHOUT ID
  file.link as "Квест",
  status as "Статус",
  priority as "Приоритет",
  opened_in_session as "Открыт в сессии"
FROM "${questsFolderPath}"
WHERE type = "quest" AND contains(related_locations, this.file.link)
SORT entity_id ASC
\`\`\`

### Логи, связанные с этой локацией

\`\`\`dataview
TABLE WITHOUT ID
  file.link as "Лог",
  date as "Дата",
  status as "Статус",
  session_ref as "Сессия"
FROM "${logsFolderPath}"
WHERE type = "log" AND contains(related_locations, this.file.link)
SORT date DESC
\`\`\`

## Заметки
`;

    const createdFile = await ctx.vault.create(filePath, content);
    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    new Notice(`Локация ${fileName} создана в кампании ${ctx.campaignTitle}.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания локации.");
    console.error(error);
  }
};
