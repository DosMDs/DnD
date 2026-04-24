const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFilePath, currentFile } = helpers.getCurrentFileOrThrow(
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

  const currentQuestGiver = currentFrontmatter.quest_giver;

  if (!currentQuestGiver || !String(currentQuestGiver).trim()) {
    throw new Error("У квеста сейчас не заполнено поле quest_giver.");
  }

  await helpers.updateFrontmatter(app, currentFile, (questFm) => {
    questFm.quest_giver = "";
    questFm.updated = helpers.today();
  });

  new Notice("Квестодатель очищен.");
} catch (error) {
  new Notice(error.message || "Ошибка очистки квестодателя.");
  console.error(error);
}
