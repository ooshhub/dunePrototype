// Entry point
// Dependencies
import * as electron from 'electron';
import * as http from 'http';
import helpers from './shared/nodeHelpers.mjs';
import { EventHub } from './common/EventHub.mjs';
import { DebugLogger } from './shared/DebugLogger.mjs';
import { initConfig, getUserSettings, getPublicIp } from './main/initLoader.mjs';

export const CONFIG = {};

// Call initLoader
const initialLoad = (async () => {
	let initLoad = await helpers.asyncLoader([
		{ load: Object.assign(CONFIG, initConfig(electron.app)), success: CONFIG?.PATH?.ROOT, timeout: 5000 }
	]);
})();


// Start Electron