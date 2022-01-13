import { SocketServer } from './SocketServer.mjs';
import { serverHub, slog, initServerHub } from '../serverHub.mjs';

export const startLocalServer = async (serverOptions) => {
	// Remove hard-coded options later
	Object.assign(serverOptions, {
		autoInitialize: true,
		dedicated: false,
		password: null,
		maxPlayers: 6
	});
	const localServer = new SocketServer(serverOptions);
	localServer.registerEventHub(serverHub);
	initServerHub(localServer);
	slog(`===Local Server Created===`);
	return localServer;
}