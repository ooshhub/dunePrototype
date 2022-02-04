import { SocketServer } from './SocketServer.mjs';
import { slog, initServerHub } from '../serverHub.mjs';
import { setupMapping, removeMap } from './promiseUpnp.mjs';

export const startLocalServer = async (serverOptions) => {

	// Remove hard-coded options later
	Object.assign(serverOptions, {
		autoInitialize: true,
		dedicated: false,
		password: null,
		maxPlayers: 6
	});

	const localServer = new SocketServer(serverOptions);
	await initServerHub(localServer);
	slog(`===Local Server Created===`);
	const mapping = await setupMapping(localServer.config.port, 7200).catch(e => {
		// slog([`uPnP Error:`, e.message]);
		return {err: e};
	});
	if (mapping?.result) {
		slog([`Port has been mapped: `, mapping.msg], 'info');
		localServer.removeMapping = removeMap.bind(localServer, localServer.config.port);
		// TODO: bind a mapping lease refresher to the server and lower the TTL to 5 minutes or so
	} else {
		slog([`uPnP Error:`, mapping.err.message??mapping.err], 'warn');
		// TODO: Notify host that port is not open and a uPnP port mapping could not be made.
	}
	return localServer;
}