// server event hub landing
import { EventHub } from '../shared/EventHub.mjs';
import { DebugLogger } from '../shared/DebugLogger.mjs';
import { server } from './serverFunctions.mjs';

const debug = 1;
export const serverHub = new EventHub('serverHub');
export const slog = new DebugLogger('server', serverHub, debug, 1);
const Game = {};

export const initServerHub = async (gameServer) => {

	Game.Server = gameServer;
	Game.Server.registerEventHub(serverHub);
	server.linkServer(Game.Server);


	if (serverHub.getHubState() === 'INIT') return slog(`Hub was already initialised.`);

	// Server ==> Client returns
	// Shortcut for sending to host
	serverHub.for('host', async (event, data, ...args) => {
		Object.assign(data, {targets: 'host'});
		Game.Server.sendToClient(event, data, args);
	});
	// Shortcut for sending to everyone but host
	serverHub.for('players', async (event, data, ...args) => {
		Object.assign(data, {targets: 'players'});
		Game.Server.sendToClient(event, data, args);
	});
	// Singular client expects at least one id
	serverHub.for('client', async (event, data, ...args) => {
		if (!data.targets?.length) slog(`No target ids found on event sent to "client/"`, 'warn');
		Game.Server.sendToClient(event, data, ...args)
	});
	// Clients and renderer both emit to all clients
	serverHub.for('clients', Game.Server.sendToClient);
	serverHub.for('renderer', Game.Server.sendToClient);


	// Setup server, lobby & game
	serverHub.on('requestLobby', server.getLobby);
	serverHub.on('updateLobby', server.updateLobby);
	serverHub.on('sendLobbyUpdate', Game.Server.sendToClient);

	slog(`===Server Hub online===`);
	
	serverHub.hubInitDone();
}