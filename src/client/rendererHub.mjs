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

(async () => {
	// Main process event route
	window.rendererToHub.receive('sendToRenderer', async (event, data) => renHub.trigger(event, data));
	renHub.for('main', async (event, ...args) => window.rendererToHub.send('sendToMain', event, ...args));
	// Server event route
	renHub.for('server', (event, ...args) => window.Dune?.Client?.sendToServer?.(event, ...args));
	// Self-routing in case event is sent with "renderer/" routing from within window
	renHub.for('renderer', (event, ...args) => renHub.trigger(event, ...args));
	// Game Init listeners
	renHub.on('responseHtml', ren.insertHtml);
	renHub.on('responseConfig', ren.updateConfig);
})();