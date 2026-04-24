const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);

  const currentCache = app.metadataCache.getFileCache(currentFile);
  const currentFrontmatter = currentCache?.frontmatter;

  if (!currentFrontmatter) {
    throw new Error("Не удалось прочитать frontmatter текущего файла.");
  }

  if (currentFrontmatter.type !== "quest") {
    throw new Error("Кнопка должна запускаться только из карточки квеста.");
  }

  let currentList = currentFrontmatter.related_npcs || [];

  if (!Array.isArray(currentList)) {
    currentList = [currentList];
  }

  currentList = currentList
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  if (!currentList.length) {
    throw new Error("У квеста нет связанных NPC для удаления.");
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
    placeholder: "Выбери NPC для удаления из квеста",
    options,
  });

  if (!selectedLink) {
    new Notice("Удаление NPC отменено.");
    return;
  }

  await helpers.updateFrontmatter(app, currentFile, (questFm) => {
    let nextList = questFm.related_npcs || [];

    if (!Array.isArray(nextList)) {
      nextList = [nextList];
    }

    nextList = nextList
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0 && value !== selectedLink);

    if (nextList.length) {
      questFm.related_npcs = nextList;
    } else {
      questFm.related_npcs = [];
    }

    questFm.updated = helpers.today();
  });

  const removedTitleMatch = selectedLink.match(/^\[\[[^|\]]+\|([^|\]]+)\]\]$/);
  const removedTitle = removedTitleMatch?.[1] || selectedLink;

  new Notice(`NPC удалён из квеста: ${removedTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка удаления NPC из квеста.");
  console.error(error);
}
