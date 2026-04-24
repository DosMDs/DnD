const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFilePath, currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const campaignCtx = helpers.getCampaignContextFromFilePath(app, currentFilePath);

  // Выбираем NPC из кампании
  const npcsFolderPath = `${campaignCtx.campaignFolderPath}/NPCs`;
  const npcFiles = helpers.getFilesInFolder(app, npcsFolderPath, /^\d{3}_NPC\.md$/);

  if (!npcFiles.length) {
    new Notice("В кампании нет NPC.");
    return;
  }

  const chosenNpc = await helpers.chooseFileBySuggester(
    engine, app, npcFiles,
    (f) => helpers.getFileTitle(app, f, f.basename),
    "Добавить NPC во фракцию:",
  );
  if (!chosenNpc) return;

  const npcLink = helpers.buildDisplayLinkFromFile(app, chosenNpc);
  const factionLink = helpers.buildDisplayLinkFromFile(app, currentFile);

  // Обновляем faction у NPC
  await helpers.updateFrontmatter(app, chosenNpc, (fm) => {
    fm.faction = factionLink;
    fm.updated = helpers.today();
  });

  new Notice(`NPC ${helpers.getFileTitle(app, chosenNpc, chosenNpc.basename)} добавлен во фракцию.`);
} catch (error) {
  new Notice(error.message || "Ошибка добавления NPC во фракцию.");
  console.error(error);
}
