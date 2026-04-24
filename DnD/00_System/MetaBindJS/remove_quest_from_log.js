const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);

  const currentCache = app.metadataCache.getFileCache(currentFile);
  const currentFrontmatter = currentCache?.frontmatter;

  if (!currentFrontmatter) {
    throw new Error("Не удалось прочитать frontmatter текущего файла.");
  }

  if (currentFrontmatter.type !== "log") {
    throw new Error("Кнопка должна запускаться только из карточки лога.");
  }

  let currentList = currentFrontmatter.related_quests || [];
  if (!Array.isArray(currentList)) {
    currentList = [currentList];
  }

  currentList = currentList.map((v) => String(v).trim()).filter(Boolean);

  if (!currentList.length) {
    throw new Error("У лога нет связанных квестов для удаления.");
  }

  const options = currentList.map((linkValue) => {
    const match = linkValue.match(/^\[\[([^|\]]+)(?:\|([^|\]]+))?\]\]$/);
    const rawPath = match?.[1] || linkValue;
    const displayTitle = match?.[2] || rawPath.split("/").pop() || linkValue;

    return {
      label: displayTitle,
      description: rawPath,
      value: linkValue,
    };
  });

  const selectedLink = await engine.prompt.suggester({
    placeholder: "Выбери квест для удаления из лога",
    options,
  });

  if (!selectedLink) {
    new Notice("Удаление квеста отменено.");
    return;
  }

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    let nextList = fm.related_quests || [];
    if (!Array.isArray(nextList)) {
      nextList = [nextList];
    }

    fm.related_quests = nextList
      .map((v) => String(v).trim())
      .filter((v) => v && v !== selectedLink);

    fm.updated = helpers.today();
  });

  const removedTitleMatch = selectedLink.match(/^\[\[[^|\]]+\|([^|\]]+)\]\]$/);
  const removedTitle = removedTitleMatch?.[1] || selectedLink;

  new Notice(`Квест удалён из лога: ${removedTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка удаления квеста из лога.");
  console.error(error);
}
