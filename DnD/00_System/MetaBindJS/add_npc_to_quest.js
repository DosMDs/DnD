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
    "Выбери NPC для добавления в квест",
  );

  if (!selectedFile) {
    new Notice("Добавление NPC отменено.");
    return;
  }

  const npcLink = helpers.buildDisplayLinkFromFile(app, selectedFile);
  const npcTitle = helpers.getFileTitle(
    app,
    selectedFile,
    selectedFile.basename,
  );

  await helpers.updateFrontmatter(app, currentFile, (questFm) => {
    helpers.appendUniqueFrontmatterListValue(questFm, "related_npcs", npcLink);
    questFm.updated = helpers.today();
  });

  new Notice(`NPC добавлен в квест: ${npcTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка добавления NPC в квест.");
  console.error(error);
}
