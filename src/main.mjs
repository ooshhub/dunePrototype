import * as electron from 'electron';
// import { helpers } from './shared/helpers.mjs';
// import { helpers as nHelpers } from './shared/nodeHelpers.mjs';
import { EventHub } from './shared/EventHub.mjs';
import { DebugLogger } from './shared/DebugLogger.mjs';
import { initConfig } from './main/initLoader.mjs';

export const CONFIG = { DEBUG: 1 };
export const mainHub = new EventHub('mainHub');
export const mlog = new DebugLogger('mainLog', mainHub, 1, 1);

mlog(`===Dependencies Loaded===`);

// Call initLoader
(async () => {
	let initLoad = await initConfig(electron.app, CONFIG);
	if (initLoad) {
		mlog(`===Initialised settings===`);
		startElectron();
	} else {
		console.error(new Error('Core load failed.'));
	electron.app.exit();
	}
})();

const startElectron = async () => {
	mlog(`Starting Electron...`);
	electron.app.exit();
}