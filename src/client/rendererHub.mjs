// Event hub landing for client
import { EventHub } from '../shared/EventHub.mjs';
// import { SocketClient } from  './net/SocketClient.mjs';
import { ren } from './rendererFunctions.mjs';
import { DebugLogger, DebugReceiver } from '../shared/DebugLogger.mjs';
import { MentatSystem } from './mentat/thufir.mjs';

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

// Useful variables
const currentPlayer = {
	pid: null,
	playerName: '',
	houseName: '',
	houseReference: '',
	hid: null,
};

(() => {
	// Event messaging
	// Main process
	window.rendererToHub.receive('sendToRenderer', async (event, data) => renHub.trigger(event, data));
	renHub.for('main', async (event, ...args) => window.rendererToHub.send('sendToMain', event, ...args));
	// Server messaging. Attach ids to data
	renHub.for('server', (event, data, ...args) => {
		data = data === undefined ? {} : data;
		try {	Object.assign(data, {
				pid: currentPlayer.pid,
				hid: currentPlayer.hid });
		} catch(e) { rlog(`Bad data object sent to server, could not attach ids`, 'warn') }
		window.Dune?.Client?.sendToServer?.(event, data, ...args);
	});
	// Self-routing
	renHub.for('renderer', (event, ...args) => renHub.trigger(event, ...args));

	// Game Init listeners
	renHub.on('responseHtml', ren.insertHtml);
	renHub.on('responseConfig', ren.updateConfig);

	// HTML
	// Show & Hide are convenience triggers. Use Fade for full control of params
	renHub.on('showElement', (el) => ren.transitionSection(el, 'in'));
	renHub.on('hideElement', (el) => ren.transitionSection(el, 'out'));
	renHub.on('fadeElement', ren.transitionSection);

	// Server connection
	// renHub.on('auth', (data) => currentPlayer.pid = data);
	renHub.on('joinServer', ren.joinServer);
	renHub.on('serverKick', (reason) => {
		rlog([`Kicked from server: ${reason}`]);
		window.Dune.Session?.setServerStatus(false);
	});
	// Successful connect - save server settings & session state
	renHub.on('authSuccess', (playerData) => {
		Object.assign(currentPlayer, playerData);
		window.Dune.ActivePlayer = currentPlayer;
		window.Dune.Session?.update();
		window.Dune.Session?.setServerStatus(true, playerData.setSessionToken);
		renHub.trigger('server/requestLobby', playerData);
	});
	
	// TODO: standardise event names, fuckwit. Is it lobbyError or errorLobby?
	// Lobby
	renHub.on('responseLobbySetup', ren.setupLobby);
	renHub.on('responseLobby', ren.joinLobby);
	renHub.on('refreshLobby', ren.updateLobby);
	/* *MAINMENU* renHub.on('initLobby', lobby.init); */
	renHub.on('cancelLobby', ren.cancelLobby);
	renHub.on('lobbyError', (err) => {
		// TODO: This is where we need an error Modal - look at Modal Controller
		rlog(err, 'error');
	});

	// Game Updates
	renHub.on('updatePlayerList', ren.updatePlayerList);

	// Mentat system
	renHub.on('mentatLoad', MentatSystem.load);
	renHub.on('responseMentat', MentatSystem.append);

	/* External handlers

	./audio/audio.mjs
		renHub.on('playSound')
		renHub.on('playMusic')

	./canvas/stageManager.mjs
		renHub.on()

	./chat/chat.mjs
		renHub.on('chatMessage', getMessage);

	*/

	})();