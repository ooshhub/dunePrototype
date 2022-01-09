// socketio server Class
import { createServer } from 'http';
import * as socketio from 'socket.io';
const { Server } = socketio;

export class SocketServer {

	#maxUpgradeAttempts = 10;
	#logAttempts = {};
	#blackList = [];
	#debug = 1;

	#playerList = {};
	#houseList = {};

	constructor(serverOptions) {
		let options = {
			config: {
				port: serverOptions.hostPort || 8080,
				path: serverOptions.path || '/',
				password: serverOptions.password || null,
				dedicated: serverOptions.dedicated || false
			},
			host: {
				playerName: serverOptions.playerName,
				pid: serverOptions.pid
			}
		};
		Object.assign(this, options);
		const httpServer = createServer();
		this.io = new Server(httpServer, {
      path: options.path,
      connectTimeout: 5000,
    });

		if (serverOptions.autoInitialize) this.initServer();
	}
	// Immediate middleware to upgrade http request ==> websocket
	async #verifyUpgrade(socket, next) {
		if (!socket.handshake?.auth || !socket.handshake?.headers) return this.#slog(`socketServer: refused upgrade attempt - no headers present`);
		let cleanIp = socket.handshake.address.replace(/\./g, '_').replace(/[^\d_]/g, '');
		if (this.#blackList[cleanIp] && this.#blackList[cleanIp] > this.#maxUpgradeAttempts) return this.#slog(`Blacklisted cunt was told to fuck off: ${cleanIp}`)
		this.#slog(`===UPGRADE REQUEST FROM ${/1/.test(cleanIp) ? 'localhost' : cleanIp}===`);
		if (!socket.handshake.headers.game === 'dune' || !socket.handshake.auth?.playerName) {
			socket.disconnect(true);
			this.#slog(`Connection from ${cleanIp} was rejected.`, 'warn');
			this.#addLogAttempt(cleanIp);
		} else {
			next();
		}
	}
	// Blacklist an ip after too many failures to verify/upgrade connection
	#addLogAttempt = (cleanIp) => {
		this.#logAttempts[cleanIp] ?
		this.#logAttempts[cleanIp] > this.#maxUpgradeAttempts ?
			this.#blackList.push(cleanIp)
			: this.#logAttempts[cleanIp] ++
		: this.#logAttempts[cleanIp] = 0;
		this.#slog(`${cleanIp} has tried to log in ${this.#logAttempts[cleanIp]} time(s).`);
	}
	// Direct server logging. TODO: change to subscription model
	// TODO: run through cyclic reference removal, or STOP SENDING SOCKET THROUGH SOCKET DICKHEAD
	#slog = (msgs, style='log') => {
		if (this.#debug && console[style]) {
			msgs = Array.isArray(msgs) ? msgs : [msgs];
			console[style](...msgs);
			// Reroute this to serverHub, only send back through sockets on subscription?
			this.sendToClient('serverLog', {targets: 0, msgs: msgs, style: style});
		}
	};




	initServer(upgradeMiddleware = this.#verifyUpgrade, customMessaging = []) {
		if (/function/i.test(typeof(upgradeMiddleware))) this.io.use(upgradeMiddleware);
		if (!customMessaging.length) this.#initClientMessaging();
		else customMessaging.forEach(handler => {
			this.io.on(handler.eventName, async (socket) => handler.eventHandler(socket));
		});
	}
}