const helpers = await engine.importJs("00_System/MetaBindJS/dnd_mb_helpers.js");

try {
  const { currentFilePath, currentFile } = helpers.getCurrentFileOrThrow(context, app);
  const campaignCtx = helpers.getCampaignContextFromFilePath(app, currentFilePath);
  const lastSessionNo = helpers.getLastSessionNoOrThrow(campaignCtx.campaignFrontmatter);
  const { sessionTitle, sessionLink } = helpers.buildSessionDisplayLink(
    app,
    campaignCtx.campaignFolderPath,
    lastSessionNo,
  );

  await helpers.updateFrontmatter(app, currentFile, (questFm) => {
    questFm.status = "failed";
    questFm.closed_in_session = sessionLink;
    questFm.updated = helpers.today();
  });

  new Notice(`Квест провален. closed_in_session = ${sessionTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка провала квеста.");
  console.error(error);
}
