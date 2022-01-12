import { SocketServer } from './SocketServer.mjs';

export const startLocalServer = async (serverOptions) => {
	// Remove hard-coded options later
	Object.assign(serverOptions, {
		autoInitialize: true,
		dedicated: false,
		password: null,
		maxPlayers: 6
	});
	return new SocketServer(serverOptions);
}