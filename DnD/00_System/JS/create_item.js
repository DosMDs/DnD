module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const itemsFolderPath = `${ctx.campaignFolderPath}/Items`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      itemsFolderPath,
      /^\d{3}_Item\.md$/,
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_Item.md`;
    const filePath = `${itemsFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    const itemTitleInput = await tp.system.prompt(
      "Название предмета:",
      `Предмет ${nextId}`,
    );
    if (!itemTitleInput) {
      new Notice("Создание предмета отменено: не указано название.");
      return;
    }

    const statusInput = await tp.system.prompt("Статус предмета:", "owned");
    const holderInput = await tp.system.prompt("Владелец предмета:", "");
    const today = tp.date.now("YYYY-MM-DD");

    const content = `---
type: item
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${itemTitleInput}
aliases:
  - ${itemTitleInput}
status: ${statusInput || "owned"}
holder: ${holderInput || ""}
related_quests:
related_locations:
tags:
  - dnd
  - item
created: ${today}
updated: ${today}
---
# \`VIEW[{title}]\`

> Кампания: [[${ctx.campaignFilePath.replace(/\\.md$/, "")}|${ctx.campaignTitle}]]

> [!actions-row] ОСНОВНЫЕ ДЕЙСТВИЯ
> \`\`\`meta-bind-button
> label: Во владении
> icon: package-check
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: owned
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Потерян
> icon: package-search
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: lost
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Уничтожен
> icon: package-x
> style: destructive
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: destroyed
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Неизвестно
> icon: help-circle
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: unknown
> \`\`\`

## Общая информация

- **Название:** \`INPUT[text:title]\`
- **Статус:** \`INPUT[inlineSelect(option(owned), option(lost), option(destroyed), option(unknown)):status]\`
- **Владелец:** \`INPUT[text:holder]\`

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

\`BUTTON[item-aliases-sync]\`

\`\`\`meta-bind-button
id: item-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
\`\`\`

## Описание

## Текущий владелец

\`VIEW[{holder}]\`

## Связи

### Связанные квесты

\`VIEW[{related_quests}][text(renderMarkdown)]\`

\`BUTTON[item-add-quest, item-remove-quest]\`

\`\`\`meta-bind-button
id: item-add-quest
label: Добавить квест
icon: scroll-text
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/add_quest_to_item.js"
\`\`\`

\`\`\`meta-bind-button
id: item-remove-quest
label: Удалить квест
icon: scroll
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/remove_quest_from_item.js"
\`\`\`

### Связанные локации

\`VIEW[{related_locations}][text(renderMarkdown)]\`

\`BUTTON[item-add-location, item-remove-location]\`

\`\`\`meta-bind-button
id: item-add-location
label: Добавить локацию
icon: map-pin-plus
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/add_location_to_item.js"
\`\`\`

\`\`\`meta-bind-button
id: item-remove-location
label: Удалить локацию
icon: map-pin-x
style: destructive
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/remove_location_from_item.js"
\`\`\`

## Заметки
`;

    const createdFile = await ctx.vault.create(filePath, content);
    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    new Notice(`Предмет ${fileName} создан в кампании ${ctx.campaignTitle}.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания предмета.");
    console.error(error);
  }
};
