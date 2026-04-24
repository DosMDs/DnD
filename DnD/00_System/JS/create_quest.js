module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const questsFolderPath = `${ctx.campaignFolderPath}/Quests`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      questsFolderPath,
      /^\d{3}_Quest\.md$/,
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_Quest.md`;
    const filePath = `${questsFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    const questTitleInput = await tp.system.prompt(
      "Название квеста:",
      `Квест ${nextId}`,
    );
    if (!questTitleInput) {
      new Notice("Создание квеста отменено: не указано название.");
      return;
    }

    const priorityInput = await tp.system.prompt("Приоритет:", "medium");
    const openedInSessionInput = await tp.system.prompt(
      "Открыт в сессии (например 001_Session, можно оставить пустым):",
      "",
    );

    const today = tp.date.now("YYYY-MM-DD");

    const openedInSession = helpers.buildSessionDisplayLink(
      ctx.app,
      ctx.vault,
      ctx.campaignFolderPath,
      openedInSessionInput,
    );

    const content = `---
type: quest
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${questTitleInput}
aliases:
  - ${questTitleInput}
status: active
priority: ${priorityInput || "medium"}
quest_giver:
related_npcs:
related_locations:
opened_in_session: ${openedInSession ? `"${openedInSession}"` : ""}
closed_in_session:
tags:
  - dnd
  - quest
created: ${today}
updated: ${today}
---
# \`VIEW[{title}]\`

> Кампания: [[${ctx.campaignFilePath.replace(/\.md$/, "")}|${ctx.campaignTitle}]]

> [!actions-row] ОСНОВНЫЕ ДЕЙСТВИЯ
> \`\`\`meta-bind-button
> label: Сделать активным
> icon: play
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
> label: Поставить на паузу
> icon: pause
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: paused
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Закрыть квест
> icon: book-check
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/close_quest_with_last_session.js"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Провалить квест
> icon: x
> style: destructive
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/fail_quest_with_last_session.js"
> \`\`\`

## Общая информация

- **Название:** \`INPUT[text:title]\`
- **Статус:** \`INPUT[inlineSelect(option(active), option(paused), option(completed), option(failed), option(hidden)):status]\`
- **Приоритет:** \`INPUT[inlineSelect(option(low), option(medium), option(high)):priority]\`
- **Кто выдал квест:** \`VIEW[{quest_giver}][text(renderMarkdown)]\`
- **Открыт в сессии:** \`VIEW[{opened_in_session}][text(renderMarkdown)]\`
- **Закрыт в сессии:** \`VIEW[{closed_in_session}][text(renderMarkdown)]\`

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

\`BUTTON[quest-giver-add, quest-giver-clear, quest-aliases-sync]\`

\`\`\`meta-bind-button
id: quest-giver-add
label: Назначить квестодателя
icon: user-round-plus
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/add_quest_giver_to_quest.js"
\`\`\`

\`\`\`meta-bind-button
id: quest-giver-clear
label: Очистить квестодателя
icon: user-round-x
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/clear_quest_giver_from_quest.js"
\`\`\`

\`\`\`meta-bind-button
id: quest-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
\`\`\`

## Описание

## Цель

## Участники

## Ход выполнения

## Связи

### Связанные NPC

\`VIEW[{related_npcs}][text(renderMarkdown)]\`

\`BUTTON[quest-add-npc, quest-remove-npc]\`

\`\`\`meta-bind-button
id: quest-add-npc
label: Добавить NPC
icon: user-round-plus
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/add_npc_to_quest.js"
\`\`\`

\`\`\`meta-bind-button
id: quest-remove-npc
label: Удалить NPC
icon: user-round-x
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/remove_npc_from_quest.js"
\`\`\`

### Связанные локации

\`VIEW[{related_locations}][text(renderMarkdown)]\`

\`BUTTON[quest-add-location, quest-remove-location]\`

\`\`\`meta-bind-button
id: quest-add-location
label: Добавить локацию
icon: map-pin-plus
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/add_location_to_quest.js"
\`\`\`

\`\`\`meta-bind-button
id: quest-remove-location
label: Удалить локацию
icon: map-pin-x
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/remove_location_from_quest.js"
\`\`\`
`;

    const createdFile = await ctx.vault.create(filePath, content);
    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    new Notice(`Квест ${fileName} создан в кампании ${ctx.campaignTitle}.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания квеста.");
    console.error(error);
  }
};
