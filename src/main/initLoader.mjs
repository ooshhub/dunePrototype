import * as http from 'http';
import { helpers } from '../shared/helpers.mjs';
import { helpers as nodeHelpers } from '../shared/nodeHelpers.mjs';
import { mainHub } from '../main.mjs';

export const initConfig = async (electronApp, configReference) => {
	let rootPath = electronApp?.getAppPath();
	if (!rootPath) return new Error(`initConfig error: no root path to Electron found.`);
	const config = {
		NET: {
			PUBLIC_IP: "",
		},
		PATH: {
			ROOT: rootPath,
			USERDATA: `${rootPath}/config`, // change to electron.app.getPath('userData') later
			SAVEGAME: `${rootPath}/saves`,
			HTML: `${rootPath}/client/templates`,
			HBS: `${rootPath}/client/templates/hbs`,
		},
	};
	Object.assign(configReference, config);
	if (configReference.PATH.ROOT) {
		let loadResult = await helpers.parallelLoader([
			{ name: `playerSettings`, load: getUserSettings(configReference) },
			{ name: `netSettings`, load: getPublicIp(configReference) }
		]);
		if (loadResult.failures === 0) {
			console.log(loadResult.msgs.join('\n'));
			return true;
		} else {
			console.error(loadResult.errs.join('\n'));
			return false;
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
			settings = await nodeHelpers.getFile(`${configReference.PATH.ROOT}/config/defaultUserSettings.json`);
			await nodeHelpers.saveFile(settingsPath, JSON.stringify(settings));
		}
		if (!/^[A-Za-z]_/.test(`${settings?.player?.id}`)) {
			settings.player.id = helpers.generatePlayerId(process?.env?.USERNAME);
			console.log(`New player ID generated: ${settings.player.id}`);
			mainHub.trigger('saveConfig', settings);
		}
		configReference.userSettings = settings;
	} catch(e) {
		err=e;
	}
	let outcome = err ?? true;
	return outcome;
}

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