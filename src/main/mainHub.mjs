// main process event hub
import { mainHub, electronRoot, mlog } from '../main.mjs';
import { main } from './mainFunctions.mjs';

// First round of handlers
mainHub.on('requestHtml', main.renderHtml);
mainHub.on('requestConfig', main.getConfig);
mainHub.on('writeConfig', main.modifyConfig);

// Wait for main window to attach listeners
mainHub.once('mainWindowReady', ({ win }) => {
	// ipc passthrough for main <==> renderer messaging
	mainHub.for('renderer', (event, ...args) => win?.webContents?.send?.('sendToRenderer', event, ...args));
	electronRoot.ipcMain.on('receiveFromRenderer', async (ipcEvent, event, ...args) => mainHub.trigger(event, ...args));
	// save on quit
	electronRoot.app.on('before-quit', (ev) => { ev.preventDefault(); main.exitAndSave(); });
	// other events
	mainHub.on('startServer', main.startServer);
	mainHub.on('killServer', main.killServer);
	mainHub.on('exitGame', main.exitAndSave);
	mainHub.on('inspectElement', main.inspectEl);
	mainHub.on('writeClipboard', (str) => main.ioClipboard(str||'no text'));
	mainHub.on('readClipboard', main.ioClipboard);
	mainHub.on('requestMentatHtml', main.renderMentatHtml);

	mlog(`===mainHub handlers registered===`);
});