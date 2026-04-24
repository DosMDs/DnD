module.exports = async (tp) => {
  try {
    const helpers = tp.user.dnd_helpers;
    const ctx = helpers.getCampaignContext(tp);

    const sessionsFolderPath = `${ctx.campaignFolderPath}/Sessions`;
    const nextId = helpers.getNextEntityId(
      ctx.vault,
      sessionsFolderPath,
      /^\d{3}_Session\.md$/,
    );

    const paddedId = helpers.padEntityId(nextId);
    const fileName = `${paddedId}_Session.md`;
    const filePath = `${sessionsFolderPath}/${fileName}`;

    const existingFile = ctx.vault.getAbstractFileByPath(filePath);
    if (existingFile) {
      new Notice(`Файл уже существует: ${fileName}`);
      return;
    }

    // ── 1. Название сессии ────────────────────────────────────────────────────
    const sessionTitleInput = await tp.system.prompt(
      "Название сессии:",
      `Сессия ${nextId}`,
    );
    if (!sessionTitleInput) {
      new Notice("Создание сессии отменено: не указано название.");
      return;
    }

    // ── 2. Сдвиг игровой даты ─────────────────────────────────────────────────
    const fm = ctx.campaignFrontmatter;
    const currentWorldLabel = fm?.world_date_label || "дата не задана";

    const dayDeltaRaw = await tp.system.prompt(
      `Сдвиг игровых дней с прошлой сессии (0 = без изменений):\nТекущая дата: ${currentWorldLabel}`,
      "0",
    );
    const dayDelta = parseInt(dayDeltaRaw ?? "0", 10) || 0;

    const sessionDate = tp.date.now("YYYY-MM-DD");

    // ── 3. Обновляем мировое время в кампании ────────────────────────────────
    let newWorldLabel = currentWorldLabel;
    if (dayDelta !== 0 && fm?.world_total_hours != null) {
      const currentTotalHours = Number(fm.world_total_hours);
      const nextTotalHours = currentTotalHours + dayDelta * 24;
      if (nextTotalHours < 0) {
        new Notice("Нельзя сдвинуть время раньше начала календаря. Дата не изменена.");
      } else {
        const nextState = helpers.totalHoursToHarptosState(nextTotalHours);
        await helpers.applyWorldStateToCampaign(ctx.app, ctx.campaignFile, nextState, sessionDate);
        newWorldLabel = nextState.world_date_label;
      }
    }

    // ── 4. Обновляем last_session в кампании ─────────────────────────────────
    await helpers.updateCampaignLastSession(ctx.app, ctx.campaignFile, nextId, sessionDate);

    // ── 5. Создаём файл сессии ────────────────────────────────────────────────
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
world_date: "${newWorldLabel}"
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
- **Дата реальная:** \`INPUT[date:date]\`
- **Дата игровая:** \`VIEW[{world_date}]\`
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
    await ctx.app.workspace.getLeaf(true).openFile(createdFile);

    const dateMsg = dayDelta !== 0 ? ` | Игровая дата: ${newWorldLabel}` : "";
    new Notice(`Сессия ${fileName} создана.${dateMsg}`);
  } catch (error) {
    new Notice(error.message || "Ошибка создания сессии.");
    console.error(error);
  }
};
