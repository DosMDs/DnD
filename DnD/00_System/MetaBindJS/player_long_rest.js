const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const cache = app.metadataCache.getFileCache(currentFile);
  const fm = cache?.frontmatter;
  if (!fm) throw new Error("Не удалось прочитать frontmatter.");

  const hpMax           = Number(fm.hp_max ?? 0);
  const hitDiceTotal    = Number(fm.hit_dice_total ?? 0);
  const hitDiceCurrent  = Number(fm.hit_dice_current ?? 0);

  // Длинный отдых: восстанавливаем половину потраченных костей хитов (мин. 1)
  const spentDice   = hitDiceTotal - hitDiceCurrent;
  const regainDice  = Math.max(1, Math.floor(spentDice / 2));
  const newDiceCur  = Math.min(hitDiceTotal, hitDiceCurrent + regainDice);

  await helpers.updateFrontmatter(app, currentFile, (f) => {
    // HP — полное восстановление
    f.hp_current = hpMax;
    f.hp_temp    = 0;
    // Кости хитов
    f.hit_dice_current = newDiceCur;
    // Спасброски смерти
    f.death_saves_success = 0;
    f.death_saves_failure = 0;
    // Ячейки заклинаний — восстанавливаем все
    for (let i = 1; i <= 9; i++) {
      const maxKey = `slot_${i}_max`;
      const curKey = `slot_${i}_current`;
      if (f[maxKey] !== undefined) f[curKey] = f[maxKey];
    }
    // Истощение снижается на 1 (мин. 0)
    if (f.exhaustion > 0) f.exhaustion = f.exhaustion - 1;
  });

  const lines = [
    `🌙 Длинный отдых завершён.`,
    `HP: ${hpMax}/${hpMax}`,
    `Кости хитов восстановлено: ${regainDice} (теперь ${newDiceCur}/${hitDiceTotal})`,
    `Ячейки заклинаний восстановлены.`,
  ];
  new Notice(lines.join("\n"));
} catch (error) {
  new Notice(error.message || "Ошибка длинного отдыха.");
  console.error(error);
}
