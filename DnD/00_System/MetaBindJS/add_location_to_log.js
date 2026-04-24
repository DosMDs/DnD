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

  const folderPath = `${campaignCtx.campaignFolderPath}/Locations`;
  let files = helpers.getFilesInFolder(app, folderPath, /^\d{3}_Location\.md$/);

  files = files.filter((file) => {
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.type === "location";
  });

  if (!files.length) {
    throw new Error("В кампании не найдено ни одной локации.");
  }

  const selectedFile = await helpers.chooseFileBySuggester(
    engine,
    app,
    files,
    (file) => helpers.getFileTitle(app, file, file.basename),
    "Выбери локацию для добавления в лог",
  );

  if (!selectedFile) {
    new Notice("Добавление локации отменено.");
    return;
  }

  const value = helpers.buildDisplayLinkFromFile(app, selectedFile);
  const title = helpers.getFileTitle(app, selectedFile, selectedFile.basename);

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    helpers.appendUniqueFrontmatterListValue(fm, "related_locations", value);
    fm.updated = helpers.today();
  });

  new Notice(`Локация добавлена в лог: ${title}`);
} catch (error) {
  new Notice(error.message || "Ошибка добавления локации в лог.");
  console.error(error);
}
