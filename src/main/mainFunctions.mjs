import { mainHub, mlog, CONFIG, electronRoot } from '../main.mjs';
import { helpers } from '../shared/helpers.mjs';
import { helpers as nHelpers } from '../shared/nodeHelpers.mjs';
import { getMenuItems } from '../client/mainMenu/menuItems.mjs';
import { startLocalServer } from '../server/net/localServer.mjs';

const server = {};

export const main = (() => {
	/*
	// NET
	*/
	const startServer = async ({ serverOptions }) => {
		let err;
		// Kill old server if still there
		if (server.host) {
			mlog('Server is already up', 'warn');
			mainHub.trigger('rendererHub/killSocket');
			await killServer();
			helpers.timeout(500);
		}
		mlog([`Starting server with options`, serverOptions], 'info');
		try {
			server.local = await startLocalServer(serverOptions);
			if (!server.local) throw new Error(`Server shit the bed!`);
		} catch(e) { err = e; }
		if (err) { mlog(err, 'error'); return false }
		mlog(`Server started on ${serverOptions.hostPort}...`);
		await helpers.timeout(500);
		//// Use localhost for testing ////
		serverOptions.hostIp = 'localhost';
		mainHub.trigger('renderer/joinServer', { serverOptions: serverOptions });
	}

	const killServer = async () => {
		mlog(`Destroying server...`);
		try { await server.local.destroy() } catch(e) { mlog(e, 'error') }
		server.local = null;
	}

	/*
	// HTML
	*/
	const renderHtml = async ({req}) => {
		mlog(`HTML was requested`, req);
		req = helpers.toArray(req);
		Promise.all(req.map(async (r) => {
			let hbsPath = '', hbsData = {};
			if (r === 'canvas') hbsPath = `${CONFIG.PATH.HBS}/gameCanvas.hbs`;
			else if (r === 'mainmenu') hbsPath = `${CONFIG.PATH.HBS}/menuBody.hbs`, hbsData = { config: CONFIG.userSettings, menuItems: getMenuItems(CONFIG.userSettings) }
			else if (r === 'ui') hbsPath = `${CONFIG.PATH.HBS}/gameUi.hbs`;
			else if (r === 'ingamemenu') hbsPath = `${CONFIG.PATH.HBS}/inGameMenu.hbs`, hbsData = { player: CONFIG.userSettings }
			else if (r === 'chat') hbsPath = `${CONFIG.PATH.HBS}/chat.hbs`;
			let resHtml = await nHelpers.compileHbs(hbsPath, hbsData);
			if (resHtml) mainHub.trigger('renderer/responseHtml', {req: r, html: resHtml});
			else mlog([`Error loading HTML`, resHtml], 'error');
		}));
	}

	/*
	// CONFIG & SETTINGS
	*/
	const modifyConfig = async ({ path, data, options } ) => {
		if (!data || !path) return mlog(`modifyConfig: no data received with request`, data);
		console.log(`modifying config for key ${path}...`);
		let target = nHelpers.getObjectPath(CONFIG, path, options?.createPath||true);
		Object.assign(target, data);
		mlog(CONFIG.userSettings);
		if (!options?.noSave) saveConfig();
	}
	const getConfig = async () => mainHub.trigger('renderer/responseConfig', { CONFIG });
	const saveConfig = async () => nHelpers.saveFile(`${CONFIG.PATH.USERDATA}/userSettings.json`, JSON.stringify(CONFIG.userSettings||CONFIG.USERSETTINGS));

	const exitAndSave = async () => { // erm.... saveAndExit would be a more sensible name
		await saveConfig();
		console.log(`Saved settings.`);
		electronRoot.app.exit();
	}

	return {
		startServer, killServer,
		renderHtml,
		modifyConfig, getConfig, exitAndSave
	}

})();