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

    const titleInput = await tp.system.prompt(
      "Имя персонажа:",
      `Персонаж ${nextId}`,
    );
    if (!titleInput) {
      new Notice("Создание персонажа отменено: не указано имя.");
      return;
    }

    const playerNameInput = await tp.system.prompt("Имя игрока:", "");
    const classInput = await tp.system.prompt("Класс:", "");
    const raceInput = await tp.system.prompt("Раса:", "");
    const levelInput = await tp.system.prompt("Уровень:", "1");
    const statusInput = await tp.system.prompt("Статус персонажа:", "active");
    const partyRoleInput = await tp.system.prompt("Роль в партии:", "");

    const today = tp.date.now("YYYY-MM-DD");

    const content = `---
type: player_character
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${titleInput}
aliases:
  - ${titleInput}
player_name: ${playerNameInput || ""}
class: ${classInput || ""}
race: ${raceInput || ""}
level: ${levelInput || 1}
status: ${statusInput || "active"}
party_role: ${partyRoleInput || ""}
tags:
  - dnd
  - player
created: ${today}
updated: ${today}
---
# \`VIEW[{title}]\`

> Кампания: [[${ctx.campaignFilePath.replace(/\\.md$/, "")}|${ctx.campaignTitle}]]

> [!actions-row] ОСНОВНЫЕ ДЕЙСТВИЯ
> \`\`\`meta-bind-button
> label: Активен
> icon: shield-check
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
> label: Завершил путь
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

## Общая информация

- **Имя персонажа:** \`INPUT[text:title]\`
- **Имя игрока:** \`INPUT[text:player_name]\`
- **Класс:** \`INPUT[text:class]\`
- **Раса:** \`INPUT[text:race]\`
- **Уровень:** \`INPUT[number:level]\`
- **Статус:** \`INPUT[inlineSelect(option(active), option(inactive), option(retired), option(dead)):status]\`
- **Роль в партии:** \`INPUT[text:party_role]\`

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

\`BUTTON[player-aliases-sync]\`

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

## Игрок

## Характеристики

## Роль в партии

## История

## Заметки
`;

    const createdFile = await ctx.vault.create(filePath, content);
    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    new Notice(`Персонаж ${fileName} создан в кампании ${ctx.campaignTitle}.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания персонажа.");
    console.error(error);
  }
};
