import { mainHub, mlog, CONFIG, electronRoot, Win } from '../main.mjs';
import { Helpers } from '../shared/Helpers.mjs';
import { helpers as nHelpers } from '../shared/nodeHelpers.mjs';
import { getMenuItems } from '../client/mainMenu/menuItems.mjs';
// import { startLocalServer } from '../server/net/localServer.mjs';

const server = {};

export const main = (() => {
  /*
  // NET
  */
  const startServer = async ({ serverOptions }) => {
    let startLocalServer = (await import('../server/net/localServer.mjs')).startLocalServer;
    // mlog(startLocalServer);
    // Kill old server if still there
    if (server.local) {
      mlog('Server is already up', 'warn');
      mainHub.trigger('rendererHub/killSocket');
      await killServer();
      server.local = null;
      Helpers.timeout(2000);
    }
    mlog([`Starting server with options`, serverOptions], 'info');
    let serverResult = {};
    let mappingResult = {};
    try {
      const { localServer, mapping } = await startLocalServer(serverOptions);
      if (localServer) {
        server.local = localServer;
        Object.assign(mappingResult, mapping);
      } else {
        serverResult.err = `Failed to create server`;
      }
    } catch(e) { serverResult.err = e; }
    if (serverResult.err) {
      mlog(serverResult.err, 'error');
      mainHub.trigger('renderer/popupMessage', { type: 'error', title: 'Error', message: `Failed to create server<br>${serverResult.err}` });
      return false;
    }
    else {
      mlog(`Server started on ${serverOptions.hostPort}...`);
      mainHub.trigger('renderer/popupMessage', { title: 'Server Init', message: `Server Created:<br> ${mappingResult.msg||mappingResult.err||''}` });
      await Helpers.timeout(500);
      //// Use localhost for testing ////
      serverOptions.selfJoin = true;
      serverOptions.hostIp = CONFIG.NET.PUBLIC_IP || '';
      mainHub.trigger('renderer/joinServer', { serverOptions: serverOptions });
    }
  }

  const killServer = async () => {
    mlog(`Destroying server...`);
    try { await server?.local?.destroy() } catch(e) { mlog(e.msg??e.message??`Server error`, 'error') }
    server.local = null;
  }

  /*
  // HTML
  */
  const renderHtml = async ({req, data}) => {
    mlog(`HTML was requested`, req);
    req = Helpers.toArray(req);
    Promise.all(req.map(async (r) => {
      let hbsPath = '', hbsData = {};
      if (r === 'canvas') hbsPath = `${CONFIG.PATH.HBS}/gameCanvas.hbs`;
      else if (r === 'mainmenu') hbsPath = `${CONFIG.PATH.HBS}/menuBody.hbs`, hbsData = { config: CONFIG.userSettings, menuItems: getMenuItems(CONFIG.userSettings) }
      else if (r === 'ui') hbsPath = `${CONFIG.PATH.HBS}/gameUi.hbs`;
      else if (r === 'ingamemenu') hbsPath = `${CONFIG.PATH.HBS}/inGameMenu.hbs`, hbsData = { player: CONFIG.userSettings }
      else if (r === 'chat') hbsPath = `${CONFIG.PATH.HBS}/chat.hbs`;
      else if (r === 'lobby') hbsPath = `${CONFIG.PATH.HBS}/lobby.hbs`, hbsData = data;
      let resHtml = await nHelpers.compileHbs(hbsPath, hbsData);
      if (resHtml) mainHub.trigger('renderer/responseHtml', {req: r, html: resHtml});
      else mlog([`Error loading HTML`, resHtml], 'error');
    }));
  }
  const renderMentatHtml = async ({ container, template, data }) => {
    if (!template || !container || !data) return mlog(`Missing data for Mentat render`, 'warn');
    let responseHtml = await nHelpers.compileHbs(`${CONFIG.PATH.HBS}/${template}`, {house: data});
    // responseHtml = addTooltips(responseHtml);
    if (responseHtml) mainHub.trigger(`renderer/responseMentat`, { target: container, html: responseHtml });
    else mlog([`Error loading HTML`, responseHtml], 'error');
  }

  const inspectEl = async ({ x,y }) => {
    if (Win.Main || !parseInt(x) || !parseInt(y)) {
      Win.Main.inspectElement(x,y);
    } else mlog(`Couldn't find main window or bad pos data: (${x}, ${y})`);
  }

  /*
  // CONFIG & SETTINGS
  */
  // TODO: allow array of changes
  const modifyConfig = async ( { path, data, options={} } ) => {
    if (!data || !path) return mlog(`modifyConfig: no data received with request`, data);
    let target = Helpers.getObjectPath(CONFIG, path, options?.createPath||true);
    mlog([`Writing to config...`, target, data]);
    Object.assign(target, data);
    mlog(CONFIG.userSettings);
    if (!options.noSave) saveConfig();
  }
  const getConfig = async () => mainHub.trigger('renderer/responseConfig', { CONFIG });
  const saveConfig = async () => nHelpers.saveFile(`${CONFIG.PATH.USERDATA}/userSettings.json`, JSON.stringify(CONFIG.userSettings));

  const exitAndSave = async () => { // erm.... saveAndExit would be a more sensible name
    console.log(`Saving settings...`);
    Helpers.timeout(50);
    await saveConfig()
      .catch((e) => {
        electronRoot.app.exit();
        throw new Error(e);
      });
    electronRoot.app.exit();
  }

  /**
   * OTHER
   */
  const ioClipboard = async (inputString) => {
    if (inputString) 	electronRoot.clipboard.writeText(`${inputString}`);
    else {
      let content = await 	electronRoot.clipboard.readText();
      content = content ?? 'no text';
      mainHub.trigger('renderer/responseClipboard', content);
    }
  }

  return {
    startServer, killServer,
    renderHtml, renderMentatHtml, inspectEl,
    modifyConfig, getConfig, exitAndSave,
    ioClipboard
  }

})();