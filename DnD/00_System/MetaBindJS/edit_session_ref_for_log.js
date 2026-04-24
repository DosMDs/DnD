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

  const folderPath = `${campaignCtx.campaignFolderPath}/Sessions`;
  let files = helpers.getFilesInFolder(app, folderPath, /^\d{3}_Session\.md$/);

  files = files.filter((file) => {
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.type === "session";
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
    placeholder: "Выбери связанную сессию для лога",
    options: [clearOption, ...fileOptions],
  });

  if (!selected) {
    new Notice("Изменение сессии отменено.");
    return;
  }

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    if (selected === "__CLEAR__") {
      fm.session_ref = "";
    } else {
      fm.session_ref = helpers.buildDisplayLinkFromFile(app, selected);
    }
    fm.updated = helpers.today();
  });

  if (selected === "__CLEAR__") {
    new Notice("Связанная сессия очищена.");
  } else {
    new Notice(
      `Связанная сессия обновлена: ${helpers.getFileTitle(app, selected, selected.basename)}`,
    );
  }
} catch (error) {
  new Notice(error.message || "Ошибка изменения сессии.");
  console.error(error);
}
