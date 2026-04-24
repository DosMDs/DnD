const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const cache = app.metadataCache.getFileCache(currentFile);
  const fm = cache?.frontmatter;
  if (!fm) throw new Error("Не удалось прочитать frontmatter.");

  const hpMax = Number(fm.hp_max ?? 0);

  await helpers.updateFrontmatter(app, currentFile, (f) => {
    f.hp_current           = hpMax;
    f.hp_temp              = 0;
    f.death_saves_success  = 0;
    f.death_saves_failure  = 0;
  });

  new Notice(`Полное восстановление HP: ${hpMax}/${hpMax}`);
} catch (error) {
  new Notice(error.message || "Ошибка восстановления HP.");
  console.error(error);
}
