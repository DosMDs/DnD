module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const npcsFolderPath = `${ctx.campaignFolderPath}/NPCs`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      npcsFolderPath,
      /^\d{3}_NPC\.md$/,
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_NPC.md`;
    const filePath = `${npcsFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    const npcTitleInput = await tp.system.prompt("Имя NPC:", `NPC ${nextId}`);
    if (!npcTitleInput) {
      new Notice("Создание NPC отменено: не указано имя.");
      return;
    }

    const statusInput = await tp.system.prompt("Статус NPC:", "alive");
    const roleInput = await tp.system.prompt("Роль в истории:", "");

    // Предлагаем выбрать из существующих фракций (если есть)
    const factionsFolderPath = `${ctx.campaignFolderPath}/Factions`;
    const factionFiles = ctx.vault
      .getMarkdownFiles()
      .filter((f) => f.path.startsWith(`${factionsFolderPath}/`) && /^\d{3}_Faction\.md$/.test(f.name))
      .sort((a, b) => a.path.localeCompare(b.path));

    let factionLink = "";
    if (factionFiles.length > 0) {
      const factionChoices = ["(без фракции)", ...factionFiles.map((f) => {
        const cache = ctx.app.metadataCache.getFileCache(f);
        return cache?.frontmatter?.title || f.basename;
      })];
      const factionChoice = await tp.system.suggester(factionChoices, factionChoices, false, "Фракция NPC:");
      if (factionChoice && factionChoice !== "(без фракции)") {
        const chosen = factionFiles.find((f) => {
          const cache = ctx.app.metadataCache.getFileCache(f);
          return (cache?.frontmatter?.title || f.basename) === factionChoice;
        });
        if (chosen) {
          const factionTitle = ctx.app.metadataCache.getFileCache(chosen)?.frontmatter?.title || chosen.basename;
          factionLink = `[[${chosen.path.replace(/\.md$/, "")}|${factionTitle}]]`;
        }
      }
    } else {
      const factionInput = await tp.system.prompt("Фракция (можно оставить пустым):", "");
      factionLink = factionInput || "";
    }
    const locationInput = await tp.system.prompt(
      "Домашняя локация (например 001_Location, можно оставить пустым):",
      "",
    );

    const lastSessionNo = ctx.campaignFrontmatter?.last_session_no;
    const defaultSessionKey =
      lastSessionNo !== null &&
      lastSessionNo !== undefined &&
      String(lastSessionNo).trim() !== ""
        ? `${helpers.padEntityId(lastSessionNo)}_Session`
        : "";

    const firstSeenInput = await tp.system.prompt(
      "Первая встреча в сессии (например 001_Session, можно оставить пустым):",
      defaultSessionKey,
    );

    const lastSeenInput = await tp.system.prompt(
      "Последняя встреча в сессии (например 001_Session, можно оставить пустым):",
      firstSeenInput || defaultSessionKey,
    );

    const today = tp.date.now("YYYY-MM-DD");

    const homeLocation = helpers.buildLocationDisplayLink(
      ctx.app,
      ctx.vault,
      ctx.campaignFolderPath,
      locationInput,
    );

    const firstSeen = helpers.buildSessionDisplayLink(
      ctx.app,
      ctx.vault,
      ctx.campaignFolderPath,
      firstSeenInput,
    );

    const lastSeen = helpers.buildSessionDisplayLink(
      ctx.app,
      ctx.vault,
      ctx.campaignFolderPath,
      lastSeenInput,
    );

    const questsFolderPath = `${ctx.campaignFolderPath}/Quests`;

    const content = `---
type: npc
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${npcTitleInput}
aliases:
  - ${npcTitleInput}
status: ${statusInput || "alive"}
faction: ${factionLink ? `"${factionLink}"` : ""}
role_in_story: ${roleInput || ""}
home_location: ${homeLocation ? `"${homeLocation}"` : ""}
first_seen: ${firstSeen ? `"${firstSeen}"` : ""}
last_seen: ${lastSeen ? `"${lastSeen}"` : ""}
related_quests:
issued_quests:
tags:
  - dnd
  - npc
created: ${today}
updated: ${today}
---
# \`VIEW[{title}]\`

> Кампания: [[${ctx.campaignFilePath.replace(/\\.md$/, "")}|${ctx.campaignTitle}]]

> [!actions-row] ОСНОВНЫЕ ДЕЙСТВИЯ
> \`\`\`meta-bind-button
> label: Жив
> icon: heart
> style: primary
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: alive
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Мёртв
> icon: skull
> style: destructive
> class: dnd-action-button dnd-action-status
> action:
>   type: js
>   file: "00_System/MetaBindJS/mark_npc_dead_in_last_session.js"
> \`\`\`
>
> \`\`\`meta-bind-button
> label: Пропал
> icon: search
> style: default
> class: dnd-action-button dnd-action-status
> action:
>   type: updateMetadata
>   bindTarget: status
>   evaluate: false
>   value: missing
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

- **Имя:** \`INPUT[text:title]\`
- **Статус:** \`INPUT[inlineSelect(option(alive), option(dead), option(missing), option(unknown)):status]\`
- **Фракция:** \`INPUT[text:faction]\`
- **Роль в истории:** \`INPUT[text:role_in_story]\`
- **Домашняя локация:** \`VIEW[{home_location}][text(renderMarkdown)]\`
- **Первая встреча:** \`VIEW[{first_seen}][text(renderMarkdown)]\`
- **Последняя встреча:** \`VIEW[{last_seen}][text(renderMarkdown)]\`

##### ДОПОЛНИТЕЛЬНЫЕ ДЕЙСТВИЯ

\`BUTTON[npc-edit-home-location, npc-edit-first-seen, npc-edit-last-seen]\`
\`BUTTON[npc-set-faction, npc-aliases-sync]\`

\`\`\`meta-bind-button
id: npc-edit-home-location
label: Изменить дом. локацию
icon: house
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/edit_home_location_for_npc.js"
\`\`\`

\`\`\`meta-bind-button
id: npc-edit-first-seen
label: Изменить первую встречу
icon: calendar-plus
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/edit_first_seen_for_npc.js"
\`\`\`

\`\`\`meta-bind-button
id: npc-edit-last-seen
label: Изменить последнюю встречу
icon: calendar-range
style: primary
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/edit_last_seen_for_npc.js"
\`\`\`

\`\`\`meta-bind-button
id: npc-aliases-sync
label: Синхр. aliases
icon: refresh-cw
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/sync_title_to_aliases.js"
\`\`\`

\`\`\`meta-bind-button
id: npc-set-faction
label: Изменить фракцию
icon: flag
style: default
hidden: true
action:
  type: js
  file: "00_System/MetaBindJS/set_npc_faction.js"
\`\`\`

## Описание

## Роль в истории

## Отношение к партии

## Связи

### Квесты, выданные этим NPC

\`\`\`dataview
TABLE WITHOUT ID
  file.link as "Квест",
  status as "Статус",
  priority as "Приоритет",
  opened_in_session as "Открыт в сессии"
FROM "${questsFolderPath}"
WHERE type = "quest" AND quest_giver = this.file.link
SORT entity_id ASC
\`\`\`

### Квесты, где NPC указан как связанный

\`\`\`dataview
TABLE WITHOUT ID
  file.link as "Квест",
  status as "Статус",
  priority as "Приоритет",
  opened_in_session as "Открыт в сессии"
FROM "${questsFolderPath}"
WHERE type = "quest" AND contains(related_npcs, this.file.link)
SORT entity_id ASC
\`\`\`

## Заметки
`;

    const createdFile = await ctx.vault.create(filePath, content);
    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    new Notice(`NPC ${fileName} создан в кампании ${ctx.campaignTitle}.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания NPC.");
    console.error(error);
  }
};
