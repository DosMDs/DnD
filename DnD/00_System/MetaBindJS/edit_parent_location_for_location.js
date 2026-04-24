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

  if (currentFrontmatter.type !== "location") {
    throw new Error("Кнопка должна запускаться только из карточки локации.");
  }

  const folderPath = `${campaignCtx.campaignFolderPath}/Locations`;
  let files = helpers.getFilesInFolder(app, folderPath, /^\d{3}_Location\.md$/);

  files = files.filter((file) => {
    if (file.path === currentFile.path) {
      return false;
    }

    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.type === "location";
  });

  const clearOption = {
    label: "— Очистить поле —",
    value: "__CLEAR__",
  };

  const fileOptions = files.map((file) => ({
    label: helpers.getFileTitle(app, file, file.basename),
    value: file,
  }));

  const selected = await engine.prompt.suggester({
    placeholder: "Выбери родительскую локацию",
    options: [clearOption, ...fileOptions],
  });

  if (!selected) {
    new Notice("Изменение родительской локации отменено.");
    return;
  }

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    if (selected === "__CLEAR__") {
      fm.parent_location = "";
    } else {
      fm.parent_location = helpers.buildDisplayLinkFromFile(app, selected);
    }
    fm.updated = helpers.today();
  });

  if (selected === "__CLEAR__") {
    new Notice("Родительская локация очищена.");
  } else {
    new Notice(
      `Родительская локация обновлена: ${helpers.getFileTitle(app, selected, selected.basename)}`,
    );
  }
} catch (error) {
  new Notice(error.message || "Ошибка изменения родительской локации.");
  console.error(error);
}
