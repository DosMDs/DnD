const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);

  const coinType = await engine.prompt.suggester({
    placeholder: "Тип монет:",
    options: [
      { label: "🟤 Медные (cp)",      value: "coin_cp" },
      { label: "⚪ Серебряные (sp)",  value: "coin_sp" },
      { label: "🔵 Электрум (ep)",    value: "coin_ep" },
      { label: "🟡 Золотые (gp)",     value: "coin_gp" },
      { label: "⚪ Платиновые (pp)",  value: "coin_pp" },
    ],
  });
  if (!coinType) return;

  const rawAmount = await engine.prompt.text({
    title: "Получить монеты",
    placeholder: "Количество:",
  });
  if (rawAmount === null) return;

  const amount = parseInt(rawAmount, 10);
  if (isNaN(amount) || amount <= 0) { new Notice("Введи положительное число."); return; }

  const cache = app.metadataCache.getFileCache(currentFile);
  const fm    = cache?.frontmatter;
  const prev  = Number(fm?.[coinType] ?? 0);

  await helpers.updateFrontmatter(app, currentFile, (f) => {
    f[coinType] = prev + amount;
  });

  const label = { coin_cp: "cp", coin_sp: "sp", coin_ep: "ep", coin_gp: "gp", coin_pp: "pp" }[coinType];
  new Notice(`+${amount} ${label}. Теперь: ${prev + amount} ${label}`);
} catch (error) {
  new Notice(error.message || "Ошибка пополнения кошелька.");
  console.error(error);
}
