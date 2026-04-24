const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile, currentFilePath } = helpers.getCurrentFileOrThrow(
    context,
    app,
  );

  const currentCache = app.metadataCache.getFileCache(currentFile);
  const currentFrontmatter = currentCache?.frontmatter;

  if (!currentFrontmatter) {
    throw new Error("Не удалось прочитать frontmatter текущего файла.");
  }

  if (currentFrontmatter.type !== "quest") {
    throw new Error("Кнопка должна запускаться только из карточки квеста.");
  }

  let currentList = currentFrontmatter.related_locations || [];

  if (!Array.isArray(currentList)) {
    currentList = [currentList];
  }

  currentList = currentList
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  if (!currentList.length) {
    throw new Error("У квеста нет связанных локаций для удаления.");
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
    placeholder: "Выбери локацию для удаления из квеста",
    options,
  });

  if (!selectedLink) {
    new Notice("Удаление локации отменено.");
    return;
  }

  await helpers.updateFrontmatter(app, currentFile, (questFm) => {
    let nextList = questFm.related_locations || [];

    if (!Array.isArray(nextList)) {
      nextList = [nextList];
    }

    nextList = nextList
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0 && value !== selectedLink);

    questFm.related_locations = nextList;
    questFm.updated = helpers.today();
  });

  const removedTitleMatch = selectedLink.match(/^\[\[[^|\]]+\|([^|\]]+)\]\]$/);
  const removedTitle = removedTitleMatch?.[1] || selectedLink;

  new Notice(`Локация удалена из квеста: ${removedTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка удаления локации из квеста.");
  console.error(error);
}
