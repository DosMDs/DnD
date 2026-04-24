const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const cache = app.metadataCache.getFileCache(currentFile);
  const fm    = cache?.frontmatter;
  if (!fm) throw new Error("Не удалось прочитать frontmatter.");

  const currentLevel = Number(fm.level ?? 1);
  if (currentLevel >= 20) { new Notice("Персонаж уже 20-го уровня."); return; }

  const newLevel    = currentLevel + 1;
  const newProfBonus = newLevel < 5 ? 2 : newLevel < 9 ? 3 : newLevel < 13 ? 4 : newLevel < 17 ? 5 : 6;
  const hitDiceTotal = Number(fm.hit_dice_total ?? currentLevel);

  await helpers.updateFrontmatter(app, currentFile, (f) => {
    f.level             = newLevel;
    f.proficiency_bonus = newProfBonus;
    f.hit_dice_total    = hitDiceTotal + 1;
    f.hit_dice_current  = Number(f.hit_dice_current ?? hitDiceTotal) + 1;
    f.updated           = helpers.today();
  });

  const msgs = [
    `🎉 Повышение уровня! Теперь ${newLevel} уровень.`,
    `Бонус мастерства: +${newProfBonus}`,
    `Кости хитов: ${hitDiceTotal + 1}`,
    `Не забудь: обновить HP max, ячейки заклинаний и новые умения класса.`,
  ];
  new Notice(msgs.join("\n"));
} catch (error) {
  new Notice(error.message || "Ошибка повышения уровня.");
  console.error(error);
}
