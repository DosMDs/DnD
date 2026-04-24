const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);

  const currentCache = app.metadataCache.getFileCache(currentFile);
  const currentFrontmatter = currentCache?.frontmatter;

  if (!currentFrontmatter) {
    throw new Error("Не удалось прочитать frontmatter текущего файла.");
  }

  if (currentFrontmatter.type !== "item") {
    throw new Error("Кнопка должна запускаться только из карточки предмета.");
  }

  let currentList = currentFrontmatter.related_locations || [];
  if (!Array.isArray(currentList)) {
    currentList = [currentList];
  }

  currentList = currentList.map((v) => String(v).trim()).filter(Boolean);

  if (!currentList.length) {
    throw new Error("У предмета нет связанных локаций для удаления.");
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
    placeholder: "Выбери локацию для удаления у предмета",
    options,
  });

  if (!selectedLink) {
    new Notice("Удаление локации отменено.");
    return;
  }

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    let nextList = fm.related_locations || [];
    if (!Array.isArray(nextList)) {
      nextList = [nextList];
    }

    fm.related_locations = nextList
      .map((v) => String(v).trim())
      .filter((v) => v && v !== selectedLink);

    fm.updated = helpers.today();
  });

  const removedTitleMatch = selectedLink.match(/^\[\[[^|\]]+\|([^|\]]+)\]\]$/);
  const removedTitle = removedTitleMatch?.[1] || selectedLink;

  new Notice(`Локация удалена у предмета: ${removedTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка удаления локации у предмета.");
  console.error(error);
}
