const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const cache = app.metadataCache.getFileCache(currentFile);
  const fm = cache?.frontmatter;
  if (!fm) throw new Error("Не удалось прочитать frontmatter.");

  // Определяем уровень ячейки: пробуем из args, затем спрашиваем
  let slot = context?.args?.slot ? Number(context.args.slot) : null;

  if (!slot || slot < 1 || slot > 9) {
    const raw = await engine.prompt.text({
      title: "Ячейка заклинания",
      placeholder: "Уровень ячейки (1–9):",
    });
    if (raw === null) return;
    slot = parseInt(raw, 10);
    if (isNaN(slot) || slot < 1 || slot > 9) { new Notice("Неверный уровень ячейки."); return; }
  }

  const curKey = `slot_${slot}_current`;
  const maxKey = `slot_${slot}_max`;
  const current = Number(fm[curKey] ?? 0);
  const max     = Number(fm[maxKey] ?? 0);

  if (max === 0) { new Notice(`Ячейки ${slot}-го уровня недоступны.`); return; }
  if (current <= 0) { new Notice(`Ячейки ${slot}-го уровня закончились (0/${max}).`); return; }

  await helpers.updateFrontmatter(app, currentFile, (f) => {
    f[curKey] = current - 1;
  });

  new Notice(`Ячейка ${slot}-го уровня потрачена. Осталось: ${current - 1}/${max}`);
} catch (error) {
  new Notice(error.message || "Ошибка траты ячейки заклинания.");
  console.error(error);
}
