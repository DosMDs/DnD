/**
 * dnd_mb_helpers.js — JS Engine / Meta Bind helper (ES Modules)
 *
 * Единственный источник правды для всех MetaBind-кнопок.
 * Импортируется через: const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js")
 *
 * ВАЖНО: Харптос-математика намеренно дублируется из dnd_helpers.js —
 * плагины Templater (CommonJS) и JS Engine (ESM) несовместимы на уровне
 * системы модулей, поэтому единый файл технически невозможен.
 * Всё остальное (работа с vault, frontmatter, контекст кампании) — только здесь.
 */

// ─── Конфигурация ────────────────────────────────────────────────────────────

export const CAMPAIGNS_ROOT = "02_Campaigns";
export const CAMPAIGN_FOLDER_REGEX = /^02_Campaigns\/(\d{3}_Campaign)\//;

// ─── Файл и контекст ─────────────────────────────────────────────────────────

export function getCurrentFileOrThrow(context, app) {
  const currentFilePath = context.file?.path;
  if (!currentFilePath) throw new Error("Не найден текущий файл.");

  const currentFile = app.vault.getAbstractFileByPath(currentFilePath);
  if (!currentFile) throw new Error(`Не найден текущий файл по пути: ${currentFilePath}`);

  return { currentFilePath, currentFile };
}

export function getCampaignContextFromFilePath(app, filePath) {
  const match = filePath.match(CAMPAIGN_FOLDER_REGEX);
  if (!match) throw new Error("Кнопка должна запускаться из карточки сущности внутри Campaign.");

  const folderKey = match[1];
  const campaignFolderPath = `${CAMPAIGNS_ROOT}/${folderKey}`;
  const campaignFilePath = `${campaignFolderPath}/Campaign.md`;

  const campaignFile = app.vault.getAbstractFileByPath(campaignFilePath);
  if (!campaignFile) throw new Error(`Не найден файл кампании: ${campaignFilePath}`);

  const campaignCache = app.metadataCache.getFileCache(campaignFile);
  const campaignFrontmatter = campaignCache?.frontmatter;
  if (!campaignFrontmatter) throw new Error("Не удалось прочитать frontmatter кампании.");

  return { folderKey, campaignFolderPath, campaignFilePath, campaignFile, campaignFrontmatter };
}

export function getLastSessionNoOrThrow(campaignFrontmatter) {
  const lastSessionNo = campaignFrontmatter?.last_session_no;
  if (!lastSessionNo) throw new Error("У кампании не заполнено last_session_no.");
  return lastSessionNo;
}

// ─── Утилиты ─────────────────────────────────────────────────────────────────

export function padEntityId(id) {
  return String(id).padStart(3, "0");
}

export function today() {
  return window.moment().format("YYYY-MM-DD");
}

export function getFileTitle(app, file, fallback) {
  if (!file) return fallback;
  const cache = app.metadataCache.getFileCache(file);
  return cache?.frontmatter?.title || file.basename || fallback;
}

export function getFilesInFolder(app, folderPath, regex = /\.md$/) {
  return app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.startsWith(`${folderPath}/`) && regex.test(f.name))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function buildDisplayLinkFromFile(app, file) {
  const title = getFileTitle(app, file, file.basename);
  return `[[${file.path.replace(/\.md$/, "")}|${title}]]`;
}

export function buildSessionDisplayLink(app, campaignFolderPath, sessionNo) {
  const paddedNo = padEntityId(sessionNo);
  const sessionFilePath = `${campaignFolderPath}/Sessions/${paddedNo}_Session.md`;
  const sessionFile = app.vault.getAbstractFileByPath(sessionFilePath);
  const sessionTitle = getFileTitle(app, sessionFile, `${paddedNo}_Session`);

  return {
    sessionNo: paddedNo,
    sessionTitle,
    sessionLink: `[[${campaignFolderPath}/Sessions/${paddedNo}_Session|${sessionTitle}]]`,
  };
}

export function buildLocationDisplayLink(app, campaignFolderPath, locationKey) {
  if (!locationKey || !String(locationKey).trim()) return "";
  const cleanKey = String(locationKey).trim();
  const filePath = `${campaignFolderPath}/Locations/${cleanKey}.md`;
  const file = app.vault.getAbstractFileByPath(filePath);
  const title = getFileTitle(app, file, cleanKey);
  return `[[${campaignFolderPath}/Locations/${cleanKey}|${title}]]`;
}

export async function updateFrontmatter(app, file, updater) {
  await app.fileManager.processFrontMatter(file, updater);
}

export function appendUniqueFrontmatterListValue(frontmatter, fieldName, value) {
  if (!frontmatter[fieldName]) {
    frontmatter[fieldName] = [value];
    return;
  }
  if (!Array.isArray(frontmatter[fieldName])) {
    frontmatter[fieldName] = [frontmatter[fieldName]];
  }
  if (!frontmatter[fieldName].includes(value)) {
    frontmatter[fieldName].push(value);
  }
}

export function removeFrontmatterListValue(frontmatter, fieldName, value) {
  if (!frontmatter[fieldName]) return;
  if (!Array.isArray(frontmatter[fieldName])) {
    if (frontmatter[fieldName] === value) frontmatter[fieldName] = null;
    return;
  }
  const filtered = frontmatter[fieldName].filter((v) => v !== value);
  frontmatter[fieldName] = filtered.length ? filtered : null;
}

export async function chooseFileBySuggester(engine, app, files, titleGetter, placeholder) {
  if (!files.length) throw new Error("Нет доступных файлов для выбора.");

  const options = files.map((file) => ({
    label: titleGetter(file),
    description: file.basename,
    value: file,
  }));

  return await engine.prompt.suggester({ placeholder, options });
}

// ─── Харптос ─────────────────────────────────────────────────────────────────

export function isHarptosLeapYear(year) {
  return Number(year) % 4 === 0;
}

export function getHarptosSegments(year) {
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

export function getHarptosSegmentByKey(year, key) {
  return getHarptosSegments(year).find((s) => s.key === key) || null;
}

export function getHarptosDaysBeforeYear(year) {
  const n = Number(year);
  if (!Number.isInteger(n) || n < 1) throw new Error("Год Харптоса должен быть целым числом не меньше 1.");
  return (n - 1) * 365 + Math.floor((n - 1) / 4);
}

export function formatHarptosHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatHarptosDateLabel(state) {
  return `${state.world_day} ${state.world_month_label}, ${state.world_year} DR — ${formatHarptosHour(state.world_hour)}`;
}

export function buildHarptosState(year, monthKey, day, hour) {
  const y = Number(year), d = Number(day), h = Number(hour);
  if (!Number.isInteger(y) || y < 1) throw new Error("Некорректный world_year.");
  if (!Number.isInteger(d) || d < 1) throw new Error("Некорректный world_day.");
  if (!Number.isInteger(h) || h < 0 || h > 23) throw new Error("Некорректный world_hour.");

  const segment = getHarptosSegmentByKey(y, monthKey);
  if (!segment) throw new Error(`Неизвестный сегмент Харптоса: ${monthKey}`);
  if (d > segment.days) throw new Error(`Для ${segment.label} допустимы дни 1..${segment.days}.`);

  const segments = getHarptosSegments(y);
  const segmentIndex = segments.findIndex((s) => s.key === monthKey);
  const daysBeforeSegment = segments.slice(0, segmentIndex).reduce((sum, s) => sum + s.days, 0);

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

export function totalHoursToHarptosState(totalHours) {
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

export function normalizeInteger(value, fieldName) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized)) throw new Error(`Поле ${fieldName} должно быть целым числом.`);
  return normalized;
}

export function getCampaignWorldStateFromFrontmatter(frontmatter) {
  const rawTotalHours = frontmatter?.world_total_hours;

  if (rawTotalHours !== null && rawTotalHours !== undefined && String(rawTotalHours).trim() !== "") {
    return totalHoursToHarptosState(normalizeInteger(rawTotalHours, "world_total_hours"));
  }

  const year = normalizeInteger(frontmatter?.world_year, "world_year");
  const day = normalizeInteger(frontmatter?.world_day, "world_day");
  const hour = normalizeInteger(frontmatter?.world_hour, "world_hour");
  const monthKey = String(frontmatter?.world_month_key || "").trim();
  if (!monthKey) throw new Error("Поле world_month_key не заполнено.");

  return buildHarptosState(year, monthKey, day, hour);
}
