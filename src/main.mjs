import * as electron from 'electron';
import { Helpers } from './shared/Helpers.mjs';
import { EventHub } from './shared/EventHub.mjs';
import { DebugLogger } from './shared/DebugLogger.mjs';
import { initConfig } from './main/initLoader.mjs';
import  unhandled  from 'electron-unhandled';

export const CONFIG = { DEBUG: 1 };
export const mainHub = new EventHub('mainHub');
export const mlog = new DebugLogger('main', mainHub, 1, 1);
export const electronRoot = electron;
export const Win = {};

unhandled();

mlog(`===Dependencies Loaded===`);

// Call initLoader
(async () => {
	let initLoad = await initConfig(CONFIG);
	if (initLoad == 1) {
		mlog(`===Initialised settings===`);
		startElectron();
	} else {
		electron.app.exit();
		throw new Error(initLoad ?? 'Core load failed.');
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
			icon: electron.app.isPackaged ? `${CONFIG.PATH.ROOT}/assets/icons/iconAlpha.ico` : `${CONFIG.PATH.ROOT}/assets/icons/iconAlphaRed.ico`,
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
			resizable: true,
			skipTaskbar: true,
			frame: false,
			titleBarVisible: false,
		},
		html: `${CONFIG.PATH.HTML}/splash.html`
	});

	loadingFrame.once('ready-to-show', async () => {
		await Helpers.timeout(100);
		loadingFrame.show();
		Helpers.windowFade(loadingFrame, 500);
	});
	const mainFrame = await createWindow({
		browserWindow: {
			width: screen.height * (16/9),
			height: screen.height,
			resizable: true,
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
		maximize: false
	});
	Win.Main = mainFrame;
	mainHub.trigger('mainWindowReady', { win: mainFrame });

	let coreLoad = 0;
	mainHub.once('coreLoadComplete', () => coreLoad = 1);

	mainFrame.once('ready-to-show', async () => {
		await Helpers.watchCondition(() => coreLoad, '', 1000).then(async (res) => {
			if (res) {
				mainFrame.show();
				mainFrame.focus();
				await Helpers.windowFade(mainFrame, 1000);
				loadingFrame.destroy();
			} else {
				throw new Error('Core load failed.');
			}
		}).catch(e => {
			// Try to bring up main window on error
			console.error(e);
			// if (!mainFrame.isVisible()) {
				mainFrame.show();
				mainFrame.setOpacity(1.0);
				mainHub.trigger('renderer/fadeElement', 'main#mainmenu', 'in', 500);
				loadingFrame.destroy();
			// }
		});
	});
}