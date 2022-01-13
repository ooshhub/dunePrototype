// server event hub landing
import { EventHub } from '../shared/EventHub.mjs';
import { DebugLogger } from '../shared/DebugLogger.mjs';
import { server } from './serverFunctions.mjs';

const debug = 1;
export const serverHub = new EventHub('serverHub');
export const slog = new DebugLogger('server', serverHub, debug, 1);

export const initServerHub = async (gameServer) => {
	// Server ==> Client returns
	// To host
	serverHub.for('host', gameServer.sendToClient())




	serverHub.on('initLobby', server.createLobby);
	serverHub.on('returnLobbyToHost', )
	slog(`===Server Hub online===`);
}