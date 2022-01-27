import { mainHub, mlog, CONFIG, electronRoot, Win } from '../main.mjs';
import { helpers } from '../shared/helpers.mjs';
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
		let err;
		// Kill old server if still there
		if (server.local) {
			mlog('Server is already up', 'warn');
			mainHub.trigger('rendererHub/killSocket');
			await killServer();
			server.local = null;
			helpers.timeout(2000);
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
		serverOptions.selfJoin = true;
		serverOptions.hostIp = CONFIG.NET.PUBLIC_IP || '';
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
	const renderHtml = async ({req, data}) => {
		mlog(`HTML was requested`, req);
		req = helpers.toArray(req);
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
		if (responseHtml) mainHub.trigger(`renderer/responseMentat`, { target: container, html: responseHtml });
		else mlog([`Error loading HTML`, responseHtml], 'error');
	}

	const inspectEl = async ({x,y}) => {
		if (Win.Main || !parseInt(x) || !parseInt(y)) {
			Win.Main.inspectElement(x,y);
		} else mlog(`Couldn't find main window or bad pos data: (${x}, ${y})`);
	}

	/*
	// CONFIG & SETTINGS
	*/
	// TODO: allow array of changes
	const modifyConfig = async ( { path, data, options } ) => {
		if (!data || !path) return mlog(`modifyConfig: no data received with request`, data);
		let target = helpers.getObjectPath(CONFIG, path, options?.createPath||true);
		Object.assign(target, data);
		mlog(CONFIG.userSettings);
		if (!options?.noSave) saveConfig();
	}
	const getConfig = async () => mainHub.trigger('renderer/responseConfig', { CONFIG });
	const saveConfig = async () => nHelpers.saveFile(`${CONFIG.PATH.USERDATA}/userSettings.json`, JSON.stringify(CONFIG.userSettings));

	const exitAndSave = async () => { // erm.... saveAndExit would be a more sensible name
		console.log(`Saving settings...`);
		helpers.timeout(50);
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