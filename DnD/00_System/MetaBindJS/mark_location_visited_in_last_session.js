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

  await helpers.updateFrontmatter(app, currentFile, (locationFm) => {
    locationFm.status = "visited";
    locationFm.last_visited = sessionLink;
    locationFm.updated = helpers.today();
  });

  new Notice(`Локация помечена как посещённая. last_visited = ${sessionTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка пометки локации как посещённой.");
  console.error(error);
}
