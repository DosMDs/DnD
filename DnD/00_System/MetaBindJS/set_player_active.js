const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFilePath, currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const campaignCtx = helpers.getCampaignContextFromFilePath(app, currentFilePath);

  const playersFolderPath = `${campaignCtx.campaignFolderPath}/Players`;
  const allPlayers = helpers.getFilesInFolder(app, playersFolderPath, /^\d{3}_Player\.md$/);

  // Деактивируем всех остальных
  for (const pf of allPlayers) {
    if (pf.path === currentFilePath) continue;
    await helpers.updateFrontmatter(app, pf, (fm) => {
      fm.is_active = false;
      fm.status    = fm.status === "active" ? "inactive" : fm.status;
    });
  }

  // Активируем текущего
  await helpers.updateFrontmatter(app, currentFile, (fm) => {
    fm.is_active = true;
    fm.status    = "active";
    fm.updated   = helpers.today();
  });

  const title = helpers.getFileTitle(app, currentFile, currentFile.basename);
  new Notice(`✅ ${title} установлен активным персонажем.`);
} catch (error) {
  new Notice(error.message || "Ошибка смены активного персонажа.");
  console.error(error);
}
