const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);

  const cache = app.metadataCache.getFileCache(currentFile);
  const frontmatter = cache?.frontmatter;

  if (!frontmatter) {
    throw new Error("Не удалось прочитать frontmatter текущего файла.");
  }

  const rawTitle = frontmatter.title;

  if (!rawTitle || !String(rawTitle).trim()) {
    throw new Error("Поле title пустое, синхронизация невозможна.");
  }

  const cleanTitle = String(rawTitle).trim();

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    fm.aliases = [cleanTitle];
    fm.updated = helpers.today();
  });

  new Notice(`aliases синхронизированы из title: ${cleanTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка синхронизации aliases.");
  console.error(error);
}
