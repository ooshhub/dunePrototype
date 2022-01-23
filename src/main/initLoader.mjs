import * as http from 'http';
import { helpers } from '../shared/helpers.mjs';
import { helpers as nodeHelpers } from '../shared/nodeHelpers.mjs';
import { mainHub, mlog, electronRoot } from '../main.mjs';

export const initConfig = async (configReference) => {
	let electronApp = electronRoot.app;
	let rootPath = electronApp?.getAppPath();
	let externalPath = electronApp.isPackaged ? electronApp.getPath('exe').replace(/\\[^\\]+$/, '') : rootPath;
	if (!rootPath) return new Error(`initConfig error: no root path to Electron found.`);
	const config = {
		CORE: {
			PACKAGED: electronApp.isPackaged
		},
		NET: {
			PUBLIC_IP: "",
		},
		PATH: {
			ROOT: rootPath,
			USERDATA: `${externalPath}/config`, // change to electron.app.getPath('userData') later
			SAVEGAME: `${externalPath}/saves`,
			HTML: `${rootPath}/client/templates`,
			HBS: `${rootPath}/client/templates/hbs`,
			CORE: `${rootPath}/server/core`
		},
	};
	Object.assign(configReference, config);
	if (configReference.PATH.ROOT) {
		let loadResult = await helpers.parallelLoader([
			{ name: `playerSettings`, load: getUserSettings(configReference) },
			{ name: `netSettings`, load: getPublicIp(configReference) },
			{ name: `electronReady`, load: electronApp.whenReady() },
			{ name: 'mainHubInit', load: import('./mainHub.mjs') }
		]);
		if (loadResult.failures === 0) {
			mlog(loadResult.msgs.join('\n'));
			return 1;
		} else {
			return new Error(loadResult.errs.join('\n'));
		}
	}
	else return new Error(`Could not initialise core CONFIG.`);
}

// Load user settings, or get defaults
const getUserSettings = async (configReference) => {
	let settingsPath = `${configReference.PATH.USERDATA}/userSettings.json`,
			err;
	try {
		let settings = await nodeHelpers.getFile(settingsPath);
		if (!settings?.player) {
			settings = await nodeHelpers.getFile(`${configReference.PATH.USERDATA}/defaultUserSettings.json`);
			if (!settings) err = new Error(`Could not find default settings @${process.env.NODE_ENV} @@${configReference.PATH.TEMP}`);
			else await nodeHelpers.saveFile(settingsPath, JSON.stringify(settings));
		}
		if (settings?.player) {
			if (!/^[A-Za-z]_/.test(`${settings.player.pid}`)) {
				settings.player.pid = helpers.generatePlayerId(process?.env?.USERNAME);
				mlog(`New player ID generated: ${settings.player.id}`);
				mainHub.trigger('saveConfig', settings);
			}
			if (!settings.player.playerName) {
				settings.player.playerName = process.env?.USERNAME || `newPlayer_${Math.floor(Math.random()*999)}`;
			}
		}
		configReference.userSettings = settings;
	} catch(e) {
		err=e;
	}
	let outcome = err ?? true;
	return outcome;
}

// Get public facing IP
const getPublicIp = async (configReference) => {
	return new Promise((res, rej) => {
		let ipGrab = http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, (response, err) => {
			if (err) throw new Error(err);
			response.on('data', ip => {
				configReference.NET.PUBLIC_IP = ip.toString();
				res(true);
			});
		});
		ipGrab.on('error', (e) => { console.log('getPublicIp error: ', e); rej(e) });
    setTimeout(() => rej(false), 3000);
  }).catch(e => console.log(e));
};