const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const cache = app.metadataCache.getFileCache(currentFile);
  const fm = cache?.frontmatter;
  if (!fm) throw new Error("Не удалось прочитать frontmatter.");

  const hpMax          = Number(fm.hp_max ?? 0);
  const hpCurrent      = Number(fm.hp_current ?? 0);
  const hitDiceCurrent = Number(fm.hit_dice_current ?? 0);
  const hitDiceType    = String(fm.hit_dice_type ?? "d8");
  const conMod         = Math.floor((Number(fm.con ?? 10) - 10) / 2);

  if (hpCurrent >= hpMax) { new Notice("HP уже на максимуме."); return; }
  if (hitDiceCurrent <= 0) { new Notice("Нет костей хитов для трат."); return; }

  const diceCountRaw = await engine.prompt.text({
    title: "Короткий отдых",
    placeholder: `Сколько костей хитов потратить? (доступно: ${hitDiceCurrent} × ${hitDiceType}+${conMod})`,
  });
  if (diceCountRaw === null) return;

  const diceCount = Math.min(parseInt(diceCountRaw, 10) || 0, hitDiceCurrent);
  if (diceCount <= 0) { new Notice("Отменено: 0 костей."); return; }

  // Рассчитываем среднее восстановление (без реального броска в Obsidian)
  const diceSize    = parseInt(hitDiceType.replace("d", ""), 10) || 8;
  const avgPerDie   = Math.floor(diceSize / 2) + 1;
  const healTotal   = Math.max(0, diceCount * avgPerDie + diceCount * conMod);
  const newHp       = Math.min(hpMax, hpCurrent + healTotal);
  const newDiceCur  = hitDiceCurrent - diceCount;

  await helpers.updateFrontmatter(app, currentFile, (f) => {
    f.hp_current       = newHp;
    f.hit_dice_current = newDiceCur;
  });

  new Notice(
    `☕ Короткий отдых.\n` +
    `Потрачено ${diceCount}×${hitDiceType}+${conMod}: восстановлено ~${healTotal} HP\n` +
    `HP: ${newHp}/${hpMax} | Кости: ${newDiceCur}/${fm.hit_dice_total}`,
  );
} catch (error) {
  new Notice(error.message || "Ошибка короткого отдыха.");
  console.error(error);
}
