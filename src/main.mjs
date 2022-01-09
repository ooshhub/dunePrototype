import * as electron from 'electron';
import { helpers } from './shared/helpers.mjs';
import { EventHub } from './shared/EventHub.mjs';
import { DebugLogger } from './shared/DebugLogger.mjs';
import { initConfig } from './main/initLoader.mjs';

export const CONFIG = { DEBUG: 1 };
export const mainHub = new EventHub('mainHub');
export const mlog = new DebugLogger('mainLog', mainHub, 1, 1);
export const electronRoot = electron;

mlog(`===Dependencies Loaded===`);
// helpers.setLog(mlog);

// Call initLoader
(async () => {
	let initLoad = await initConfig(CONFIG);
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
	electron.nativeTheme.themeSource = 'dark';
	electron.app.setName(process.env.npm_package_productName||'Dune Prototype');
	const currentVersion = process.env.npm_package_version;
	const screen = electron.screen.getPrimaryDisplay().size;

	const createWindow = async (data) => {
		const winDefaults = {
			title: `${electron.app.name} - v${currentVersion}`,
			backgroundColor: '#201900',
			icon: `${CONFIG.PATH.ROOT}/assets/icons/iconAlpha.ico`,
			menuBarVisible: false,
			show: false,
			opacity: 0.0,
		};
		if (data.browserWindow) Object.assign(winDefaults, data.browserWindow);
		const win = new electron.BrowserWindow(winDefaults);
		if (data.dev) win.openDevTools();
		if (data.maximize) win.maximize();
		if (data.html) win.loadFile(data.html);
		return win;
	}

	const loadingFrame = await createWindow({
		browserWindow: {
			width: 768,
			height: 432,
			resizable: false,
			skipTaskbar: true,
			frame: false,
			titleBarVisible: false,
		},
		html: `${CONFIG.PATH.HTML}/splash.html`
	});

	loadingFrame.once('ready-to-show', async () => {
		await helpers.timeout(100);
		loadingFrame.show();
		helpers.windowFade(loadingFrame, 500);
	});

	const mainFrame = await createWindow({
		browserWindow: {
			width: screen.width,
			height: screen.height,
			resizable: false,
			titleBarOverlay: {
        color: '#201900',
        symbolColor: '#74b1be'
      },
			webPreferences: {
				preload: `${CONFIG.PATH.ROOT}/client/preload.cjs`,
				devTools: true
			},
		},
		html: `${CONFIG.PATH.HTML}/layout.html`,
		dev: true,
		maximize: true
	});
	mainHub.trigger('mainWindowReady', { win: mainFrame, app: electron.app });

	let coreLoad = 0;
	mainHub.once('coreLoadComplete', () => coreLoad = 1);

	mainFrame.once('ready-to-show', async () => {
		await helpers.watchCondition(() => coreLoad, '', 10000).then(async (res) => {
			if (res) {
				mainFrame.show();
				mainFrame.focus();
				await helpers.windowFade(mainFrame, 1000);
				loadingFrame.destroy();
			} else {
				throw new Error('Core load failed. Exiting.');
			}
		});
	});
}