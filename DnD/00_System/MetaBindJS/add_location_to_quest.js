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

  const locationsFolderPath = `${campaignCtx.campaignFolderPath}/Locations`;

  let locationFiles = helpers.getFilesInFolder(
    app,
    locationsFolderPath,
    /^\d{3}_Location\.md$/,
  );

  locationFiles = locationFiles.filter((file) => {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    return fm?.type === "location";
  });

  if (!locationFiles.length) {
    throw new Error("В кампании не найдено ни одной локации.");
  }

  const selectedFile = await helpers.chooseFileBySuggester(
    engine,
    app,
    locationFiles,
    (file) => helpers.getFileTitle(app, file, file.basename),
    "Выбери локацию для добавления в квест",
  );

  if (!selectedFile) {
    new Notice("Добавление локации отменено.");
    return;
  }

  const locationLink = helpers.buildDisplayLinkFromFile(app, selectedFile);
  const locationTitle = helpers.getFileTitle(
    app,
    selectedFile,
    selectedFile.basename,
  );

  await helpers.updateFrontmatter(app, currentFile, (questFm) => {
    helpers.appendUniqueFrontmatterListValue(
      questFm,
      "related_locations",
      locationLink,
    );
    questFm.updated = helpers.today();
  });

  new Notice(`Локация добавлена в квест: ${locationTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка добавления локации в квест.");
  console.error(error);
}
