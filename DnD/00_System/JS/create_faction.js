module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const factionsFolderPath = `${ctx.campaignFolderPath}/Factions`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      factionsFolderPath,
      /^\d{3}_Faction\.md$/,
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_Faction.md`;
    const filePath = `${factionsFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    const titleInput = await tp.system.prompt("Название фракции:", `Фракция ${nextId}`);
    if (!titleInput) {
      new Notice("Создание фракции отменено: не указано название.");
      return;
    }

    const alignmentInput = await tp.system.prompt("Отношение к партии:", "neutral");
    const typeInput = await tp.system.prompt("Тип фракции (guild, cult, government, military, religious, other):", "other");
    const today = tp.date.now("YYYY-MM-DD");

    const npcsFolderPath = `${ctx.campaignFolderPath}/NPCs`;

    const content = `---
type: faction
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${titleInput}
aliases:
  - ${titleInput}
alignment: ${alignmentInput || "neutral"}
faction_type: ${typeInput || "other"}
status: active
tags:
  - dnd
  - faction
created: ${today}
updated: ${today}
---
# \`VIEW[{title}]\`

> Кампания: [[${ctx.campaignFilePath.replace(/\.md$/, "")}|${ctx.campaignTitle}]]

> [!actions-row] ОСНОВНЫЕ ДЕЙСТВИЯ
> \`\`\`meta-bind-button
> label: Союзник
> icon: handshake
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: alignment
>   evaluate: false
>   value: ally
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Нейтральная
> icon: scale
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: alignment
>   evaluate: false
>   value: neutral
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Враждебная
> icon: swords
> style: destructive
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: alignment
>   evaluate: false
>   value: hostile
> \`\`\`

## Общая информация

- **Название:** \`INPUT[text:title]\`
- **Отношение к партии:** \`INPUT[inlineSelect(option(ally), option(neutral), option(hostile), option(unknown)):alignment]\`
- **Тип:** \`INPUT[inlineSelect(option(guild), option(cult), option(government), option(military), option(religious), option(other)):faction_type]\`
- **Статус:** \`INPUT[inlineSelect(option(active), option(dissolved), option(hidden)):status]\`

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

\`BUTTON[faction-aliases-sync]\`

\`\`\`meta-bind-button
id: faction-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
\`\`\`

## Описание

## Цели и мотивация

## Ресурсы и влияние

## История отношений с партией

## Ключевые NPC

\`\`\`dataview
TABLE WITHOUT ID
  file.link as "NPC",
  status as "Статус",
  role_in_story as "Роль"
FROM "${npcsFolderPath}"
WHERE type = "npc" AND faction = this.file.link
SORT entity_id ASC
\`\`\`

## Заметки
`;

    // Создать папку Factions если не существует
    const factionsFolder = ctx.vault.getAbstractFileByPath(factionsFolderPath);
    if (!factionsFolder) {
      await ctx.vault.createFolder(factionsFolderPath);
    }

    const createdFile = await ctx.vault.create(filePath, content);
    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    new Notice(`Фракция ${fileName} создана в кампании ${ctx.campaignTitle}.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания фракции.");
    console.error(error);
  }
};
