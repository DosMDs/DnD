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

  if (currentFrontmatter.type !== "log") {
    throw new Error("Кнопка должна запускаться только из карточки лога.");
  }

  const folderPath = `${campaignCtx.campaignFolderPath}/NPCs`;
  let files = helpers.getFilesInFolder(app, folderPath, /^\d{3}_NPC\.md$/);

  files = files.filter((file) => {
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.type === "npc";
  });

  if (!files.length) {
    throw new Error("В кампании не найдено ни одного NPC.");
  }

  const selectedFile = await helpers.chooseFileBySuggester(
    engine,
    app,
    files,
    (file) => helpers.getFileTitle(app, file, file.basename),
    "Выбери NPC для добавления в лог",
  );

  if (!selectedFile) {
    new Notice("Добавление NPC отменено.");
    return;
  }

  const value = helpers.buildDisplayLinkFromFile(app, selectedFile);
  const title = helpers.getFileTitle(app, selectedFile, selectedFile.basename);

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    helpers.appendUniqueFrontmatterListValue(fm, "related_npcs", value);
    fm.updated = helpers.today();
  });

  new Notice(`NPC добавлен в лог: ${title}`);
} catch (error) {
  new Notice(error.message || "Ошибка добавления NPC в лог.");
  console.error(error);
}
