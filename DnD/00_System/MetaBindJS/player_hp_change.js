const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);

  // delta может приходить из args кнопки, но MB 1.4.7 args не поддерживает —
  // поэтому спрашиваем через prompt
  const rawDelta = await engine.prompt.text({
    title: "Изменение HP",
    placeholder: "Введи число (отрицательное = урон, положительное = лечение)",
  });
  if (rawDelta === null || rawDelta === undefined) return;

  const delta = parseInt(rawDelta, 10);
  if (isNaN(delta)) { new Notice("Введи целое число."); return; }

  const cache = app.metadataCache.getFileCache(currentFile);
  const fm = cache?.frontmatter;
  if (!fm) throw new Error("Не удалось прочитать frontmatter.");

  const hpMax  = Number(fm.hp_max  ?? 0);
  const hpTemp = Number(fm.hp_temp ?? 0);
  let   hpCur  = Number(fm.hp_current ?? 0);

  if (delta < 0) {
    // Урон: сначала поглощают временные HP
    const dmg = Math.abs(delta);
    const tempAbsorbed = Math.min(hpTemp, dmg);
    const remaining    = dmg - tempAbsorbed;
    const newTemp = hpTemp - tempAbsorbed;
    hpCur = Math.max(0, hpCur - remaining);

    await helpers.updateFrontmatter(app, currentFile, (f) => {
      f.hp_current = hpCur;
      f.hp_temp    = newTemp;
      if (hpCur === 0) new Notice("⚠️ Персонаж при смерти! (0 HP)");
    });
    new Notice(`Урон ${dmg}. HP: ${hpCur}/${hpMax}${newTemp > 0 ? ` | Врем: ${newTemp}` : ""}`);
  } else {
    // Лечение: не превышать hp_max, не восстанавливает временные HP
    hpCur = Math.min(hpMax, hpCur + delta);
    await helpers.updateFrontmatter(app, currentFile, (f) => { f.hp_current = hpCur; });
    new Notice(`Лечение ${delta}. HP: ${hpCur}/${hpMax}`);
  }
} catch (error) {
  new Notice(error.message || "Ошибка изменения HP.");
  console.error(error);
}
