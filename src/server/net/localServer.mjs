import { SocketServer } from './SocketServer.mjs';
import { slog, initServerHub } from '../serverHub.mjs';
import * as natuPnP from 'nat-upnp';
import * as net from 'net';

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
	openPort();
	return localServer;
}

const openPort = () => {
	const listenServer = net.createServer((sv) => {
		slog('CONNECTION MAYBE');
		sv.on('end', () => slog('CON_END'))
	});
	listenServer.listen(2222, () => slog('listening on 2222'));
	const client = natuPnP.createClient();
	client.getMappings((e, res) => slog([`1st mapping:`, e, res]));
	client.portMapping({
		description: 'DunePrototype',
		protocol: 'tcp',
		public: 2222,
		private: 2222,
		ttl: 12000,
	}, (err) => slog(err));
	client.externalIp((err, ip) => slog([`IP: `, err, ip]));
	client.getMappings((e, res) => slog([`2nd mapping: `, e, res]));
}