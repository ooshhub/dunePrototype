// socketio server Class
import { createServer } from 'http';
import * as socketio from 'socket.io';
import { helpers } from '../../shared/helpers.mjs';
const { Server } = socketio;

export class SocketServer {

	#serverState;

	#maxUpgradeAttempts = 10;
	#logAttempts = {};
	#blackList = [];
	#debug = 1;

	#playerList = {};
	#houseList = {};

	constructor(serverOptions) {
		this.#setServerState('init');
		let options = {
			config: {
				port: serverOptions.hostPort || 8080,
				path: serverOptions.path || '/',
				password: serverOptions.password || null,
				dedicated: serverOptions.dedicated || false,
				maxPlayers: serverOptions.maxPlayers ?? 6
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
		httpServer.listen(this.config.port);
		this.io.engine.on('connection_error', this.#handleGeneralConnectionError);
		if (serverOptions.autoInitialize) this.initServer();
		this.#slog(`Server state: ${this.#serverState}`);
	}
	#setServerState(newState) {
		const states = {
			init: 'INITIALIZING',
			busy: 'BUSY',
			open: 'OPEN',
			full: 'FULL',
			destroy: 'DESTROYING'
		};
		this.#serverState = states[newState] ?? this.#serverState;
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
		this.io.on('connection', async (socket) => {
			let cleanIp = socket.handshake.address.replace(/\./g, '_').replace(/[^\d_]/g, '');
			// this.#slog(`===UPGRADED CONNECTION FROM ${socket.handshake.address} ===`);
			let playerDetails = socket.handshake.auth;
			let rejection;
			if (this.config.password && this.config.password !== playerDetails.password) rejection = new Error('Incorrect password!');
			if (!playerDetails.playerName || !playerDetails.pid) rejection = new Error(`Bad player setup - missing PID or name`);
			if (rejection) {
				this.#slog(rejection, 'error');
				this.#addLogAttempt(cleanIp);
				return;
			}
			let playerExists = await this.#checkPlayerIsAlive(playerDetails);
			if (playerExists !== undefined) {
				this.#slog(`Player reconnect attempt: checking old socket...`);
				if (playerExists) { // truthy return means player responded to ack
					return this.#slog(`Player is already connected!`, 'warn');
				} else { // null return means player exists on server but did not respond to ack
					this.#slog(`Player ${playerDetails.playerName} - failed to respond to ack on existing socket`);
					await this.#destroyPlayer(this.#playerList[playerDetails.pid], 'Failed to respond to ack request');
				}
			}
			socket.emit('auth', playerDetails.pid);
			playerDetails.isHost = this.#checkPlayerIsHost(playerDetails.pid);
			playerDetails.socket = socket;
			if (playerDetails.isHost) this.#setServerState('open');
			// Add player to server, init handlers
			this.#playerList[playerDetails.pid] = playerDetails;
			// Check number of players in lobby
			if (Object.keys(this.#playerList).length >= this.config.maxPlayers) this.#setServerState('full');
			// Update clients with new player list
			this.sendToClient('updatePlayerList', this.getPlayerList());
			socket.on('disconnect', this.#handlePlayerDisconnect);
			socket.on('message', (...args) => {
				console.log(...args);
				this.#receiveFromClient(socket, ...args)})
			this.#slog(`New player joined: ${playerDetails.playerName}${playerDetails.isHost ? ' (HOST)' : ''}`);
		});
	}
	// Set up event hub link
	#eventHub = [];
	registerEventHub(eventHubLink) {
		if (/eventhub/i.test(eventHubLink.constructor?.name) && eventHubLink.trigger)	this.#eventHub.push(eventHubLink);
		else this.#slog(`Bad Event Hub supplied to server!`, 'error');
	}
	async #receiveFromClient(socket, data, ...args) {
		try { Object.assign(data, { sid: socket.id }) }
		catch(e) { this.#slog(`Bad event received from client, data was not an Object`, 'warn') }
		this.#triggerHub(data, ...args);
	}
	async #triggerHub(...args) {	this.#eventHub.forEach(async (hub) => hub.trigger(...args));	}
	// TODO: Error handling
	async #handlePlayerDisconnect(reason) {
		if (!this.getServerState || this.getServerState() === 'DESTROYING') return;
		// TODO: revisit this. Private fields & methods causing crash on server destruction
		// if (!this.#serverState || this.#serverState === 'DESTROYING') return;
		this.#slog([`Client disconnected:`, reason], 'warn');
	}
	#handleGeneralConnectionError(details) {
		this.#slog([`Connection error: `, details], 'warn');
		// NFI what to do with this yet
	}

	// TODO: grab the socket id and look it up in the playerList
	#checkPlayerIsHost(playerId) { return (playerId === this.host.pid) ? true : false; }

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
	#destroyPlayer = async (pid, reasonForDestroy) => {
		if (!this.#playerList[pid]) return this.#slog(`destroyPlayer: bad id "${pid}"`);
		if (this.#playerList[pid].socket) {
			this.#playerList[pid].socket.send('deathnote', { msg: reasonForDestroy }||`Just because you're a cunt.`);
			this.#playerList[pid].socket.disconnect(true);
		}
		delete this.#playerList[pid];
		/* TODO: Scrub player reference from this.#houseList */
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

	async sendToClient(event, data={}, ...args) {
		let targetIds = data.targets;
		console.log(`Sending to client`, event, data);
		if (!targetIds) this.io.send(event, data, ...args);
		else {
			targetIds.forEach(id => {
				this.#houseList[id]?.currentPlayer.socket?.send(event, data, ...args)
					?? this.#playerList[id]?.socket?.send(event, data, ...args)
					?? this.#slog(`Error sending "${event}" event to id "${id}`, 'warn');
			});
		}
	}
	async destroy() {
		return new Promise(res => {
			this.#setServerState('destroy');
			this.io.emit('deathnote', { msg: `Server destroyed.` });
			for (let player in this.#playerList) { this.#playerList[player].socket?.disconnect(true); }
			this.io.close(() => res(1));
		});
	}

	getPlayerList(playerId) {
		console.log(this.#playerList);
		let output = {};
		if (this.#playerList[playerId]) output = helpers.removeCyclicReferences(this.#playerList[playerId]);
		else output = helpers.removeCyclicReferences(this.#playerList);
		console.log(output);
		return output;
	}

	getServerState() { return this.#serverState }

	initServer(customUpgradeMiddleware, customMessaging = []) {
		// Immediate middleware to upgrade http request ==> websocket
		// Cannot attach as private method, causes crashes
		const verifyUpgrade = async (socket, next) => {
			if (this.#serverState !== 'INITIALIZING' && this.#serverState !== 'OPEN') return this.#slog(`Refused connection attempt, server state is "${this.#serverState}"`);
			if (this.#serverState === 'INITIALIZING' && socket.handshake.auth.pid !== this.host.pid) return this.#slog('Refused connection attempt: Host must connect before players.' ,'warn');
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
		if (/function/i.test(typeof(upgradeMiddleware))) this.io.use(customUpgradeMiddleware);
		else this.io.use(verifyUpgrade);
		if (!customMessaging.length) this.#initDefaultMessaging();
		else customMessaging.forEach(handler => {
			this.io.on(handler.eventName, async (socket) => handler.eventHandler(socket));
		});
	}
}