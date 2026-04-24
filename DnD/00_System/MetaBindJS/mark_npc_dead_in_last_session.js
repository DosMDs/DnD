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

  await helpers.updateFrontmatter(app, currentFile, (npcFm) => {
    npcFm.status = "dead";
    npcFm.last_seen = sessionLink;
    npcFm.updated = helpers.today();
  });

  new Notice(`NPC помечен как мёртвый. last_seen = ${sessionTitle}`);
} catch (error) {
  new Notice(error.message || "Ошибка пометки NPC как мёртвого.");
  console.error(error);
}
