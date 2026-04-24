const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFilePath, currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const campaignCtx = helpers.getCampaignContextFromFilePath(app, currentFilePath);

  const factionsFolderPath = `${campaignCtx.campaignFolderPath}/Factions`;
  const factionFiles = helpers.getFilesInFolder(app, factionsFolderPath, /^\d{3}_Faction\.md$/);

  if (!factionFiles.length) {
    new Notice("В кампании нет фракций. Сначала создай фракцию.");
    return;
  }

  const chosen = await helpers.chooseFileBySuggester(
    engine, app, factionFiles,
    (f) => helpers.getFileTitle(app, f, f.basename),
    "Выбери фракцию NPC:",
  );
  if (!chosen) return;

  const factionLink = helpers.buildDisplayLinkFromFile(app, chosen);

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    fm.faction = factionLink;
    fm.updated = helpers.today();
  });

  new Notice(`Фракция обновлена: ${helpers.getFileTitle(app, chosen, chosen.basename)}`);
} catch (error) {
  new Notice(error.message || "Ошибка обновления фракции.");
  console.error(error);
}
