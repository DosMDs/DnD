const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFilePath, currentFile } = helpers.getCurrentFileOrThrow(
    context,
    app,
  );
  const campaignCtx = helpers.getCampaignContextFromFilePath(
    app,
    currentFilePath,
  );

  const currentCache = app.metadataCache.getFileCache(currentFile);
  const currentFrontmatter = currentCache?.frontmatter;

  if (!currentFrontmatter) {
    throw new Error("Не удалось прочитать frontmatter текущего файла.");
  }

  if (currentFrontmatter.type !== "quest") {
    throw new Error("Кнопка должна запускаться только из карточки квеста.");
  }

  const npcFolderPath = `${campaignCtx.campaignFolderPath}/NPCs`;

  let npcFiles = helpers.getFilesInFolder(
    app,
    npcFolderPath,
    /^\d{3}_NPC\.md$/,
  );

  npcFiles = npcFiles.filter((file) => {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    return fm?.type === "npc";
  });

  if (!npcFiles.length) {
    throw new Error("В кампании не найдено ни одного NPC.");
  }

  const selectedFile = await helpers.chooseFileBySuggester(
    engine,
    app,
    npcFiles,
    (file) => helpers.getFileTitle(app, file, file.basename),
    "Выбери NPC как квестодателя",
  );

  if (!selectedFile) {
    new Notice("Выбор квестодателя отменён.");
    return;
  }

  const npcLink = helpers.buildDisplayLinkFromFile(app, selectedFile);
  const npcTitle = helpers.getFileTitle(
    app,
    selectedFile,
    selectedFile.basename,
  );

  await helpers.updateFrontmatter(app, currentFile, (questFm) => {
    questFm.quest_giver = npcLink;
    questFm.updated = helpers.today();
  });

  new Notice(`Квестодатель установлен: ${npcTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка установки квестодателя.");
  console.error(error);
}
