module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const sessionsFolderPath = `${ctx.campaignFolderPath}/Sessions`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      sessionsFolderPath,
      /^\d{3}_Session\.md$/
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_Session.md`;
    const filePath = `${sessionsFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    const sessionTitleInput = await tp.system.prompt("Название сессии:", `Сессия ${nextId}`);
    if (!sessionTitleInput) {
      new Notice("Создание сессии отменено: не указано название.");
      return;
    }

    const sessionDate = tp.date.now("YYYY-MM-DD");

    const content = `---
type: session
entity_id: ${nextId}
campaign_id: ${ctx.campaignId}
campaign_ref: "${ctx.campaignRef}"
title: ${sessionTitleInput}
aliases:
  - ${sessionTitleInput}
session_no: ${nextId}
date: ${sessionDate}
status: played
location_refs:
npc_refs:
quest_refs:
tags:
  - dnd
  - session
created: ${sessionDate}
updated: ${sessionDate}
---
# ${sessionTitleInput}

> Кампания: [[${ctx.campaignFilePath.replace(/\.md$/, "")}|${ctx.campaignTitle}]]

## Общая информация

- **Название:** \`INPUT[text:title]\`
- **Номер сессии:** \`VIEW[{session_no}]\`
- **Дата:** \`INPUT[date:date]\`
- **Статус:** \`INPUT[inlineSelect(option(planned), option(played), option(cancelled)):status]\`

## Краткий итог

## Что произошло

## Новые NPC

## Новые квесты

## Изменения по квестам

## Локации

## Добыча / награды

## Важные решения

## Зацепки на будущее
`;

    const createdFile = await ctx.vault.create(filePath, content);

    await helpers.updateCampaignLastSession(
      ctx.app,
      ctx.campaignFile,
      nextId,
      sessionDate
    );

    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    new Notice(`Сессия ${fileName} создана в кампании ${ctx.campaignTitle}.`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания сессии.");
    console.error(error);
  }
};