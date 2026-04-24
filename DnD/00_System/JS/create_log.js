module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const logsFolderPath = `${ctx.campaignFolderPath}/Logs`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      logsFolderPath,
      /^\d{3}_Log\.md$/,
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_Log.md`;
    const filePath = `${logsFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    const logTitleInput = await tp.system.prompt(
      "Название лога:",
      `Лог ${nextId}`,
    );
    if (!logTitleInput) {
      new Notice("Создание лога отменено: не указано название.");
      return;
    }

    const lastSessionNo = ctx.campaignFrontmatter?.last_session_no;
    const defaultSessionKey =
      lastSessionNo !== null &&
      lastSessionNo !== undefined &&
      String(lastSessionNo).trim() !== ""
        ? `${helpers.padEntityId(lastSessionNo)}_Session`
        : "";

    const sessionInput = await tp.system.prompt(
      "Связанная сессия (например 001_Session, можно оставить пустым):",
      defaultSessionKey,
    );

    const statusInput = await tp.system.prompt("Статус лога:", "active");
    const today = tp.date.now("YYYY-MM-DD");

    const sessionRef = helpers.buildSessionDisplayLink(
      ctx.app,
      ctx.vault,
      ctx.campaignFolderPath,
      sessionInput,
    );

    const content = `---
type: log
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${logTitleInput}
aliases:
  - ${logTitleInput}
date: ${today}
status: ${statusInput || "active"}
session_ref: ${sessionRef ? `"${sessionRef}"` : ""}
related_npcs:
related_locations:
related_quests:
tags:
  - dnd
  - log
created: ${today}
updated: ${today}
---
# \`VIEW[{title}]\`

> Кампания: [[${ctx.campaignFilePath.replace(/\\.md$/, "")}|${ctx.campaignTitle}]]

> [!actions-row] ОСНОВНЫЕ ДЕЙСТВИЯ
> \`\`\`meta-bind-button
> label: Активный
> icon: notebook-pen
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: active
> \`\`\`
>
> \`\`\`meta-bind-button
> label: В архив
> icon: archive
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: archived
> \`\`\`

## Общая информация

- **Название:** \`INPUT[text:title]\`
- **Дата:** \`INPUT[date:date]\`
- **Статус:** \`INPUT[inlineSelect(option(active), option(archived)):status]\`
- **Сессия:** \`VIEW[{session_ref}][text(renderMarkdown)]\`

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

\`BUTTON[log-edit-session, log-aliases-sync]\`

\`\`\`meta-bind-button
id: log-edit-session
label: Изменить сессию
icon: calendar-range
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/edit_session_ref_for_log.js"
\`\`\`

\`\`\`meta-bind-button
id: log-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
\`\`\`

## Запись

## Связи

### Связанные NPC

\`VIEW[{related_npcs}][text(renderMarkdown)]\`

\`BUTTON[log-add-npc, log-remove-npc]\`

\`\`\`meta-bind-button
id: log-add-npc
label: Добавить NPC
icon: user-round-plus
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/add_npc_to_log.js"
\`\`\`

\`\`\`meta-bind-button
id: log-remove-npc
label: Удалить NPC
icon: user-round-x
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/remove_npc_from_log.js"
\`\`\`

### Связанные локации

\`VIEW[{related_locations}][text(renderMarkdown)]\`

\`BUTTON[log-add-location, log-remove-location]\`

\`\`\`meta-bind-button
id: log-add-location
label: Добавить локацию
icon: map-pin-plus
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/add_location_to_log.js"
\`\`\`

\`\`\`meta-bind-button
id: log-remove-location
label: Удалить локацию
icon: map-pin-x
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/remove_location_from_log.js"
\`\`\`

### Связанные квесты

\`VIEW[{related_quests}][text(renderMarkdown)]\`

\`BUTTON[log-add-quest, log-remove-quest]\`

\`\`\`meta-bind-button
id: log-add-quest
label: Добавить квест
icon: scroll-text
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/add_quest_to_log.js"
\`\`\`

\`\`\`meta-bind-button
id: log-remove-quest
label: Удалить квест
icon: scroll
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/remove_quest_from_log.js"
\`\`\`
`;

    const createdFile = await ctx.vault.create(filePath, content);
    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    new Notice(`Лог ${fileName} создан в кампании ${ctx.campaignTitle}.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания лога.");
    console.error(error);
  }
};
