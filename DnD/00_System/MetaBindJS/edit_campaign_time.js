const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFile } = helpers.getCurrentFileOrThrow(context, app);

  const cache = app.metadataCache.getFileCache(currentFile);
  const frontmatter = cache?.frontmatter;

  if (!frontmatter) {
    throw new Error("Не удалось прочитать frontmatter текущего файла.");
  }

  if (frontmatter.type !== "campaign") {
    throw new Error("Кнопка должна запускаться только из Campaign.md.");
  }

  const hourDelta = helpers.normalizeInteger(
    frontmatter.world_hour_delta ?? 0,
    "world_hour_delta",
  );
  if (hourDelta === 0) {
    throw new Error("Укажи ненулевое значение в поле world_hour_delta.");
  }

  const currentState =
    helpers.getCampaignWorldStateFromFrontmatter(frontmatter);
  const nextTotalHours = currentState.world_total_hours + hourDelta;

  if (nextTotalHours < 0) {
    throw new Error("Нельзя сдвинуть игровое время раньше начала календаря.");
  }

  const nextState = helpers.totalHoursToHarptosState(nextTotalHours);

  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    fm.calendar_system = "harptos";
    fm.world_year = nextState.world_year;
    fm.world_month_key = nextState.world_month_key;
    fm.world_month_label = nextState.world_month_label;
    fm.world_day = nextState.world_day;
    fm.world_hour = nextState.world_hour;
    fm.world_total_hours = nextState.world_total_hours;
    fm.world_date_label = nextState.world_date_label;
    fm.world_hour_delta = 0;
    fm.updated = helpers.today();
  });

  new Notice(`Игровое время обновлено: ${nextState.world_date_label}`);
} catch (error) {
  new Notice(error.message || "Ошибка изменения игрового времени.");
  console.error(error);
}
