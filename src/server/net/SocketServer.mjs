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
	// Add a failed upgrade or connection attempt. Blacklist an ip after too many failures 
	#addLogAttempt = (cleanIp) => {
		this.#logAttempts[cleanIp] ?
		this.#logAttempts[cleanIp] > this.#maxUpgradeAttempts ?
			this.#blackList.push(cleanIp)
			: this.#logAttempts[cleanIp] ++
		: this.#logAttempts[cleanIp] = 0;
		this.#slog(`${cleanIp} has tried to log in ${this.#logAttempts[cleanIp]} time(s).`);
	}
	#initDefaultMessaging() {
		this.io.on('connection'), async (socket) => {
			let cleanIp = socket.handshake.address.replace(/\./g, '_').replace(/[^\d_]/g, '');
			this.#slog(`===UPGRADED CONNECTION FROM ${socket.handshake.address} ===`);
			let playerDetails = socket.handshake.auth;
			let rejection;
			if (options.password && options.password !== playerDetails.password) err = new Error('Incorrect password!');
			if (!playerDetails.playerName || !playerDetails.pid) err = new Error(`Bad player setup - missing PID or name`);
			if (err) {
				this.#slog(err, 'error');
				this.#addLogAttempt(cleanIp);
				return;
			}
			let playerExists = this.#check
		}
	}
	// Supply playerData to check specific player, otherwise all players are checked
	async #healthCheckAck(socket) {
		return new Promise(res => socket.emit('healthCheck', (ack) => res(ack)));
	}
	// Check if player exists/is alive. If player is not in playerList, return undefined, if player socket is dead return null
	#checkPlayerIsAlive = async (playerData) => {
		if (!this.#playerList[playerData.pid]) return undefined;
		this.#slog(`Checking client connection for ${playerData.playerName}...`);
		const ackTimeout = 5000;
		return await Promise.race([
			helpers.timeout(ackTimeout),
			this.#healthCheckAck(this.#playerList[playerData.pid].socket)
		]);
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
		if (!customMessaging.length) this.#initDefaultMessaging();
		else customMessaging.forEach(handler => {
			this.io.on(handler.eventName, async (socket) => handler.eventHandler(socket));
		});
	}
}