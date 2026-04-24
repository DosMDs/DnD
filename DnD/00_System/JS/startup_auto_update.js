/**
 * startup_auto_update.js — Templater startup script
 *
 * Запускается автоматически при открытии vault (Templater → Startup Templates).
 * Вешает обработчик на событие 'modify' — при каждом сохранении файла:
 *   1. Обновляет frontmatter.updated до текущей даты (YYYY-MM-DD)
 *   2. Синхронизирует frontmatter.aliases[0] с frontmatter.title
 *
 * Обрабатываются только .md файлы внутри 02_Campaigns/ с полем type в frontmatter.
 * Системные файлы, шаблоны и Campaign.md — пропускаются.
 *
 * Установка:
 *   Settings → Templater → Startup Templates → добавить этот файл.
 */

module.exports = async (tp) => {
  const app = tp.app;

  // Константы
  const CAMPAIGNS_ROOT = "02_Campaigns";
  const SKIP_TYPES = new Set(["campaign"]);  // campaign обновляется скриптами явно
  const SKIP_PATH_PATTERNS = [
    /^00_System\//,
    /^01_Home\//,
  ];

  // Дебаунс — не обновляем чаще раза в 2 секунды на файл
  const debounceMap = new Map();
  const DEBOUNCE_MS = 2000;

  function shouldProcess(file) {
    if (!file || !file.path.endsWith(".md")) return false;
    if (!file.path.startsWith(`${CAMPAIGNS_ROOT}/`)) return false;
    for (const pattern of SKIP_PATH_PATTERNS) {
      if (pattern.test(file.path)) return false;
    }
    return true;
  }

  function getTodayString() {
    return window.moment().format("YYYY-MM-DD");
  }

  async function processFile(file) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (!fm || !fm.type) return;
    if (SKIP_TYPES.has(fm.type)) return;

    const today = getTodayString();
    let needsUpdate = false;

    // Проверяем нужно ли вообще что-то менять
    const titleStr = fm.title ? String(fm.title).trim() : "";
    const currentAliases = Array.isArray(fm.aliases) ? fm.aliases : (fm.aliases ? [fm.aliases] : []);
    const aliasNeedsSync = titleStr && currentAliases[0] !== titleStr;
    const updatedNeedsSync = fm.updated !== today;

    if (!aliasNeedsSync && !updatedNeedsSync) return;

    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      // 1. Обновляем updated
      if (updatedNeedsSync) {
        frontmatter.updated = today;
        needsUpdate = true;
      }

      // 2. Синхронизируем aliases[0] = title
      if (aliasNeedsSync) {
        if (!frontmatter.aliases || !Array.isArray(frontmatter.aliases)) {
          frontmatter.aliases = [titleStr];
        } else {
          // Сохраняем остальные aliases, заменяем только первый
          const rest = frontmatter.aliases.slice(1).filter((a) => a !== titleStr);
          frontmatter.aliases = [titleStr, ...rest];
        }
        needsUpdate = true;
      }
    });
  }

  // Регистрируем обработчик modify с дебаунсом
  const eventRef = app.vault.on("modify", (file) => {
    if (!shouldProcess(file)) return;

    // Дебаунс: откладываем обработку, если файл только что был обработан
    const lastRun = debounceMap.get(file.path) || 0;
    const now = Date.now();
    if (now - lastRun < DEBOUNCE_MS) return;

    debounceMap.set(file.path, now);

    // Небольшая задержка чтобы кэш метаданных успел обновиться
    setTimeout(() => {
      processFile(file).catch((err) => {
        console.warn(`[startup_auto_update] Ошибка для ${file.path}:`, err);
      });
    }, 500);
  });

  // Сохраняем ссылку на eventRef для возможной отписки при перезагрузке
  // (Obsidian сам очищает обработчики при выгрузке плагина)
  console.log("[startup_auto_update] Обработчик auto-update зарегистрирован.");
};
