// Event hub landing for client
import { EventHub } from '../shared/EventHub.mjs';
// import { SocketClient } from  './net/SocketClient.mjs';
import { ren } from './rendererFunctions.mjs';
import { DebugLogger, DebugReceiver } from '../shared/DebugLogger.mjs';

export const renHub = new EventHub('rendererHub');
const debugSources = {
	main: 1,
	server: 1,
	socket: 1,
	renderer: 1,
}
export const rlog = new DebugLogger('renderer', renHub, debugSources, 0);
const debugRec = new DebugReceiver(renHub, debugSources);
debugRec.registerHandlers();
const ids = {
	pid: null,
	hid: null
};

(() => {
	// Event messaging
	// Main process
	window.rendererToHub.receive('sendToRenderer', async (event, data) => renHub.trigger(event, data));
	renHub.for('main', async (event, ...args) => window.rendererToHub.send('sendToMain', event, ...args));
	// Server messaging. Attach ids to data
	renHub.for('server', (event, data, ...args) => {
		data.pid = ids.pid;
		data.hid = ids.hid;
		window.Dune?.Client?.sendToServer?.(event, data, ...args);
	});
	// Self-routing
	renHub.for('renderer', (event, ...args) => renHub.trigger(event, ...args));

	// Game Init listeners
	renHub.on('responseHtml', ren.insertHtml);
	renHub.on('responseConfig', ren.updateConfig);

	// Server communication
	renHub.on('auth', (data) => ids.pid = data);
	renHub.on('joinServer', ren.joinLobby);
	renHub.on('updatePlayerList', ren.updatePlayerList);

	/* External handlers

	./audio/audio.mjs
		renHub.on('playSound')
		renHub.on('playMusic')

	./canvas/stageManager.mjs
		renHub.on()

	*/

	})();