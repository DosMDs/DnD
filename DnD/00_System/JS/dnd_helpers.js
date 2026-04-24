/**
 * dnd_helpers.js — Templater user script
 *
 * Содержит ТОЛЬКО функции, специфичные для Templater (tp.system, tp.date,
 * vault.create и т.д.) и математику Харптоса, которую невозможно разделить
 * с MetaBind-стороной из-за несовместимости форматов модулей
 * (CommonJS здесь vs ESM в dnd_mb_helpers.js).
 *
 * Константы и Харптос-математика намеренно дублируются в dnd_mb_helpers.js —
 * это архитектурное ограничение плагинов Obsidian, не ошибка.
 */

// ─── Конфигурация ────────────────────────────────────────────────────────────

const CAMPAIGNS_ROOT = "02_Campaigns";
const CAMPAIGN_FOLDER_REGEX = /^02_Campaigns\/(\d{3}_Campaign)\//;

const HARPTOS_DEFAULTS = {
  year: 1496,
  monthKey: "Hammer",
  day: 1,
  hour: 8,
};

// ─── Харптос ─────────────────────────────────────────────────────────────────

function isHarptosLeapYear(year) {
  return Number(year) % 4 === 0;
}

function getHarptosSegments(year) {
  const segments = [
    { key: "Hammer",          label: "Хаммер",           days: 30, kind: "month"    },
    { key: "Midwinter",       label: "Середина зимы",    days: 1,  kind: "festival" },
    { key: "Alturiak",        label: "Алтуриак",         days: 30, kind: "month"    },
    { key: "Ches",            label: "Чес",              days: 30, kind: "month"    },
    { key: "Tarsakh",         label: "Тарсак",           days: 30, kind: "month"    },
    { key: "Greengrass",      label: "Зеленотравье",     days: 1,  kind: "festival" },
    { key: "Mirtul",          label: "Миртул",           days: 30, kind: "month"    },
    { key: "Kythorn",         label: "Киторн",           days: 30, kind: "month"    },
    { key: "Flamerule",       label: "Флеймрул",         days: 30, kind: "month"    },
    { key: "Midsummer",       label: "Середина лета",    days: 1,  kind: "festival" },
  ];

  if (isHarptosLeapYear(year)) {
    segments.push({ key: "Shieldmeet", label: "Щитовой сход", days: 1, kind: "festival" });
  }

  segments.push(
    { key: "Eleasis",          label: "Элесиас",          days: 30, kind: "month"    },
    { key: "Eleint",           label: "Элейнт",           days: 30, kind: "month"    },
    { key: "Highharvestide",   label: "Высокая жатва",    days: 1,  kind: "festival" },
    { key: "Marpenoth",        label: "Марпенот",         days: 30, kind: "month"    },
    { key: "Uktar",            label: "Уктар",            days: 30, kind: "month"    },
    { key: "FeastOfTheMoon",   label: "Праздник луны",    days: 1,  kind: "festival" },
    { key: "Nightal",          label: "Найтол",           days: 30, kind: "month"    },
  );

  return segments;
}

function getHarptosSegmentByKey(year, key) {
  return getHarptosSegments(year).find((s) => s.key === key) || null;
}

function getHarptosDaysBeforeYear(year) {
  const n = Number(year);
  if (!Number.isInteger(n) || n < 1) throw new Error("Год Харптоса должен быть целым числом не меньше 1.");
  return (n - 1) * 365 + Math.floor((n - 1) / 4);
}

function formatHarptosHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatHarptosDateLabel(state) {
  return `${state.world_day} ${state.world_month_label}, ${state.world_year} DR — ${formatHarptosHour(state.world_hour)}`;
}

function buildHarptosState(year, monthKey, day, hour) {
  const y = Number(year), d = Number(day), h = Number(hour);
  if (!Number.isInteger(y) || y < 1) throw new Error("Некорректный world_year.");
  if (!Number.isInteger(d) || d < 1) throw new Error("Некорректный world_day.");
  if (!Number.isInteger(h) || h < 0 || h > 23) throw new Error("Некорректный world_hour.");

  const segment = getHarptosSegmentByKey(y, monthKey);
  if (!segment) throw new Error(`Неизвестный сегмент Харптоса: ${monthKey}`);
  if (d > segment.days) throw new Error(`Для ${segment.label} допустимы дни 1..${segment.days}.`);

  const segments = getHarptosSegments(y);
  const daysBeforeSegment = segments
    .slice(0, segments.findIndex((s) => s.key === monthKey))
    .reduce((sum, s) => sum + s.days, 0);

  const totalDays = getHarptosDaysBeforeYear(y) + daysBeforeSegment + (d - 1);
  const worldTotalHours = totalDays * 24 + h;

  const state = {
    world_year: y,
    world_month_key: segment.key,
    world_month_label: segment.label,
    world_day: d,
    world_hour: h,
    world_total_hours: worldTotalHours,
  };
  return { ...state, world_date_label: formatHarptosDateLabel(state) };
}

function totalHoursToHarptosState(totalHours) {
  const n = Number(totalHours);
  if (!Number.isInteger(n) || n < 0) throw new Error("world_total_hours должен быть целым числом не меньше 0.");

  let remainingDays = Math.floor(n / 24);
  const worldHour = n % 24;

  let year = 1;
  while (true) {
    const yearLength = 365 + (isHarptosLeapYear(year) ? 1 : 0);
    if (remainingDays < yearLength) break;
    remainingDays -= yearLength;
    year += 1;
  }

  const segments = getHarptosSegments(year);
  let segment = segments[0];
  for (const item of segments) {
    if (remainingDays < item.days) { segment = item; break; }
    remainingDays -= item.days;
  }

  const state = {
    world_year: year,
    world_month_key: segment.key,
    world_month_label: segment.label,
    world_day: remainingDays + 1,
    world_hour: worldHour,
    world_total_hours: n,
  };
  return { ...state, world_date_label: formatHarptosDateLabel(state) };
}

function applyWorldStateToCampaign(app, campaignFile, newState, today) {
  return app.fileManager.processFrontMatter(campaignFile, (fm) => {
    fm.world_year        = newState.world_year;
    fm.world_month_key   = newState.world_month_key;
    fm.world_month_label = newState.world_month_label;
    fm.world_day         = newState.world_day;
    fm.world_hour        = newState.world_hour;
    fm.world_total_hours = newState.world_total_hours;
    fm.world_date_label  = newState.world_date_label;
    fm.updated           = today;
  });
}

function getDefaultHarptosState() {
  return buildHarptosState(
    HARPTOS_DEFAULTS.year,
    HARPTOS_DEFAULTS.monthKey,
    HARPTOS_DEFAULTS.day,
    HARPTOS_DEFAULTS.hour,
  );
}

// ─── Контекст кампании ───────────────────────────────────────────────────────

function getActiveCampaignMatch(tp) {
  const activeFile = tp.app.workspace.getActiveFile();
  if (!activeFile) throw new Error("Нет активного файла.");

  const match = activeFile.path.match(CAMPAIGN_FOLDER_REGEX);
  if (!match) throw new Error("Открой Campaign.md нужной кампании перед выполнением действия.");

  return { activeFile, activePath: activeFile.path, folderKey: match[1] };
}

function getCampaignContext(tp) {
  const app = tp.app;
  const vault = app.vault;
  const { activeFile, activePath, folderKey } = getActiveCampaignMatch(tp);

  const campaignFolderPath = `${CAMPAIGNS_ROOT}/${folderKey}`;
  const campaignFilePath = `${campaignFolderPath}/Campaign.md`;
  const campaignFile = vault.getAbstractFileByPath(campaignFilePath);
  if (!campaignFile) throw new Error(`Не найден файл кампании: ${campaignFilePath}`);

  const campaignCache = app.metadataCache.getFileCache(campaignFile);
  const campaignFrontmatter = campaignCache?.frontmatter;
  if (!campaignFrontmatter) throw new Error("Не удалось прочитать frontmatter кампании.");

  const campaignId = campaignFrontmatter.campaign_id;
  const campaignTitle = campaignFrontmatter.title || folderKey;
  const campaignRef = `[[${campaignFilePath.replace(/\.md$/, "")}]]`;

  return {
    app, vault, activeFile, activePath, folderKey,
    campaignFolderPath, campaignFilePath, campaignFile,
    campaignFrontmatter, campaignId, campaignTitle, campaignRef,
  };
}

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function getNextEntityId(vault, folderPath, fileRegex) {
  const existingIds = vault
    .getMarkdownFiles()
    .filter((f) => f.path.startsWith(`${folderPath}/`) && fileRegex.test(f.name))
    .map((f) => Number(f.basename.slice(0, 3)))
    .filter((n) => !Number.isNaN(n));
  return existingIds.length ? Math.max(...existingIds) + 1 : 1;
}

function padEntityId(id) {
  return String(id).padStart(3, "0");
}

function getFileTitle(app, file, fallback) {
  if (!file) return fallback;
  const cache = app.metadataCache.getFileCache(file);
  return cache?.frontmatter?.title || file.basename || fallback;
}

function buildDisplayLink(app, vault, filePathWithMd, displayPathWithoutMd, fallbackTitle) {
  const file = vault.getAbstractFileByPath(filePathWithMd);
  const title = getFileTitle(app, file, fallbackTitle);
  return `[[${displayPathWithoutMd}|${title}]]`;
}

function buildSessionDisplayLink(app, vault, campaignFolderPath, sessionKey) {
  if (!sessionKey || !String(sessionKey).trim()) return "";
  const cleanKey = String(sessionKey).trim();
  return buildDisplayLink(
    app, vault,
    `${campaignFolderPath}/Sessions/${cleanKey}.md`,
    `${campaignFolderPath}/Sessions/${cleanKey}`,
    cleanKey,
  );
}

function buildLocationDisplayLink(app, vault, campaignFolderPath, locationKey) {
  if (!locationKey || !String(locationKey).trim()) return "";
  const cleanKey = String(locationKey).trim();
  return buildDisplayLink(
    app, vault,
    `${campaignFolderPath}/Locations/${cleanKey}.md`,
    `${campaignFolderPath}/Locations/${cleanKey}`,
    cleanKey,
  );
}

function updateCampaignLastSession(app, campaignFile, sessionNo, sessionDate) {
  return app.fileManager.processFrontMatter(campaignFile, (fm) => {
    fm.last_session_no = sessionNo;
    fm.last_session_date = sessionDate;
    fm.updated = sessionDate;
  });
}

// ─── Экспорт ─────────────────────────────────────────────────────────────────
// Templater требует, чтобы module.exports содержал ТОЛЬКО функции.
// Константы CAMPAIGNS_ROOT и CAMPAIGN_FOLDER_REGEX живут внутри модуля
// и доступны через функции-геттеры.

module.exports = {
  // Геттеры конфигурации (вместо экспорта констант)
  getCampaignsRoot: () => CAMPAIGNS_ROOT,
  getCampaignFolderRegex: () => CAMPAIGN_FOLDER_REGEX,
  // Harptos
  getDefaultHarptosState,
  buildHarptosState,
  // Campaign context
  getCampaignContext,
  getActiveCampaignMatch,
  // Entity helpers
  getNextEntityId,
  padEntityId,
  getFileTitle,
  buildDisplayLink,
  buildSessionDisplayLink,
  buildLocationDisplayLink,
  updateCampaignLastSession,
  totalHoursToHarptosState,
  applyWorldStateToCampaign,
};
