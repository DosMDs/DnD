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

  if (currentFrontmatter.type !== "npc") {
    throw new Error("Кнопка должна запускаться только из карточки NPC.");
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
    placeholder: "Выбери первую встречу для NPC",
    options: [clearOption, ...fileOptions],
  });

  if (!selected) {
    new Notice("Изменение первой встречи отменено.");
    return;
  }

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    if (selected === "__CLEAR__") {
      fm.first_seen = "";
    } else {
      fm.first_seen = helpers.buildDisplayLinkFromFile(app, selected);
    }
    fm.updated = helpers.today();
  });

  if (selected === "__CLEAR__") {
    new Notice("Первая встреча очищена.");
  } else {
    new Notice(
      `Первая встреча обновлена: ${helpers.getFileTitle(app, selected, selected.basename)}`,
    );
  }
} catch (error) {
  new Notice(error.message || "Ошибка изменения первой встречи.");
  console.error(error);
}
