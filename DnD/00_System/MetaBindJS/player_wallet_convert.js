const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

// Курс в медных монетах: cp=1, sp=10, ep=50, gp=100, pp=1000
const RATES = { coin_cp: 1, coin_sp: 10, coin_ep: 50, coin_gp: 100, coin_pp: 1000 };
const LABELS = { coin_cp: "cp", coin_sp: "sp", coin_ep: "ep", coin_gp: "gp", coin_pp: "pp" };
const OPTIONS = [
  { label: "🟤 Медные (cp)",      value: "coin_cp" },
  { label: "⚪ Серебряные (sp)",  value: "coin_sp" },
  { label: "🔵 Электрум (ep)",    value: "coin_ep" },
  { label: "🟡 Золотые (gp)",     value: "coin_gp" },
  { label: "⚪ Платиновые (pp)",  value: "coin_pp" },
];

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);

  const from = await engine.prompt.suggester({ placeholder: "Конвертировать ИЗ:", options: OPTIONS });
  if (!from) return;

  const to = await engine.prompt.suggester({
    placeholder: "Конвертировать В:",
    options: OPTIONS.filter(o => o.value !== from),
  });
  if (!to) return;

  const rawAmount = await engine.prompt.text({
    title: "Конвертация монет",
    placeholder: `Сколько ${LABELS[from]} конвертировать?`,
  });
  if (rawAmount === null) return;

  const amount = parseInt(rawAmount, 10);
  if (isNaN(amount) || amount <= 0) { new Notice("Введи положительное число."); return; }

  const cache = app.metadataCache.getFileCache(currentFile);
  const fm    = cache?.frontmatter;
  const fromBalance = Number(fm?.[from] ?? 0);

  if (amount > fromBalance) {
    new Notice(`Недостаточно ${LABELS[from]}: ${fromBalance} < ${amount}.`);
    return;
  }

  // Считаем в медных
  const totalCp  = amount * RATES[from];
  const received = Math.floor(totalCp / RATES[to]);
  const remainder = totalCp % RATES[to];

  if (received === 0) {
    new Notice(`Невозможно: ${amount} ${LABELS[from]} меньше 1 ${LABELS[to]}.`);
    return;
  }

  const toBalance = Number(fm?.[to] ?? 0);
  // cp-остаток возвращаем
  const cpKey = "coin_cp";
  const cpBalance = Number(fm?.[cpKey] ?? 0);

  await helpers.updateFrontmatter(app, currentFile, (f) => {
    f[from] = fromBalance - amount;
    f[to]   = toBalance + received;
    if (remainder > 0 && to !== cpKey) f[cpKey] = cpBalance + remainder;
  });

  const remMsg = remainder > 0 && to !== cpKey ? `, остаток ${remainder} cp` : "";
  new Notice(`Конвертировано: ${amount} ${LABELS[from]} → ${received} ${LABELS[to]}${remMsg}`);
} catch (error) {
  new Notice(error.message || "Ошибка конвертации монет.");
  console.error(error);
}
