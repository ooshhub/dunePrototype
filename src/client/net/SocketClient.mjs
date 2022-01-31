// socket.io client Class
// TODO: rewrite
import { io } from '../lib/socket.io.esm.min.js';
import { helpers } from '../../shared/helpers.mjs';

export class SocketClient {

	#clientState;
	#debug = 1;
	#validStates = {
		INIT: 'INIT',
		INIT_LOBBY: 'INIT_LOBBY',
		CONNECTING: 'CONNECTING',
		CONNECTED: 'CONNECTED',
		CLOSING: 'CLOSING',
		ERROR: 'ERROR'
	}

	constructor(clientOptions={}) {
		Object.assign(this, {
			player: {
				playerName: clientOptions.playerName || `newPlayer_${Math.floor(Math.random()*99)}`,
				pid: clientOptions.pid,
			},
			serverOptions: {
				hostIp: clientOptions.hostIp,
				selfJoin: clientOptions.selfJoin,
				localhost: clientOptions.selfJoin,
				url: `http://${clientOptions.selfJoin ? 'localhost' : clientOptions.hostIp}:${clientOptions.hostPort||8080}`,
				hostUrl: `http://${clientOptions.hostIp}:${clientOptions.hostPort||8080}`,
				path: clientOptions.path || '/',
				password: clientOptions.password||'',
			},
		});
		// Create base Socket
		this.#socklog(`Trying to connect to ${this.serverOptions.url}...`);
		this.socket = io(this.serverOptions.url, {
			autoConnect: false,
			timeout: 5000,
			auth: {
				game: 'dune',
				playerName: this.player.playerName,
				pid: this.player.pid,
				password: clientOptions.password||'',
				sessionToken: clientOptions.sessionToken||null,
			},
			extraHeaders: {
				game: 'dune',
				reconnect: clientOptions.reconnect||0,
			}
		});

		this.#setClientState('INIT');

		this.socket.on('message', (...args) => {
			this.#triggerHub(...args);
		});

		// TODO: Connection handling
		// Dunno what's needed
		this.socket.on('disconnect', msg => this.#socklog('===Disconnected===', msg));
		this.socket.on('connect_error', (err) => {
			if (this.clientState === 'ERROR') return;
			this.#socklog(['ConnectionError', err], 'error');
			this.#setClientState('ERROR');
			// TODO: Display connection error modal
			let retries = 0, checkTimer=1000;
			let errorTimeout = setInterval((maxRetries=5) => {
				if (this.socket.connected) {
					this.#setClientState('CONNECTED');
					clearInterval(errorTimeout);
				} else {
					retries++;
					if (retries > maxRetries) this.#triggerHub('main/cancelLobby');
				}
			}, checkTimer);
		});
		this.socket.on('error', msg => this.#socklog(['Error', msg], 'error'));
		this.socket.on('reconnect_error', msg => this.#socklog(msg));
		this.socket.on('reconnect_failed', msg => this.#socklog(msg));

		// Connection destroyed by angry server
		this.socket.on('deathnote', ({ msg }) => this.#triggerHub('serverKick', msg));

		// Successful socket upgrade
		this.socket.on('connect', () => this.#socklog(`Connection Upgraded`));

		// Health check ack
		this.socket.on('healthCheck', (ack) => {
			this.#socklog(`${this.socket.id}: responding to ack req`);
			ack(1)
		});

		// Auth reply from server
		this.socket.on('auth', (playerDetails) => {
			// this.#socklog(`Auth received: ${data}`);
			if (playerDetails.isHost == null) {
				let err = `Bad auth reply from server`;
				this.#socklog(err, 'error');
				this.socket.close();
				this.#triggerHub('authReject', err);
			} else {
				this.player.isHost = playerDetails.isHost;
				this.#setClientState('INIT_LOBBY');
				this.#socklog([`Authenticated ${playerDetails.isHost ? 'HOST' : 'PLAYER'} with server`]);
				// Start Lobby init event
				this.#triggerHub('authSuccess', playerDetails);
			}
		});
	}

	#setClientState(newState) {
		this.#clientState = this.#validStates[newState] ?? this.#clientState;
	}
	get clientState() { return this.#clientState }

	async connectToGame(maxAttemptTime=8000) {
		if (this.clientState === 'CONNECTING' || this.socket.connected) return this.#socklog(`Already connected/connecting!`, 'warn');
		this.#setClientState('CONNECTING');
		this.#socklog(`Connecting...`);
		this.socket.connect();
		await Promise.race([
			helpers.timeout(maxAttemptTime),
			helpers.watchCondition(() => this.socket.connected)
		]);
		if (!this.socket.connected) {
			this.socket.close();
			this.#setClientState('ERROR');
			this.#socklog(`Connection timeout, server not found or connection upgrade refused`);
			return 0;
		} else return 1;
	}

	inLobby() { this.#setClientState('CONNECTED')	}

	async destroy() {
		this.#setClientState('CLOSING');
		this.socket.close();
		return 1
	}

	

	// Link to event hub
	#eventHub = [];
	registerEventHub(eventHubLink) {
		if (/eventhub/i.test(eventHubLink.constructor?.name) && eventHubLink.trigger)	this.#eventHub.push(eventHubLink);
		else this.#socklog(`Bad Event Hub supplied to server!`, 'error');
	}
	// Messages to hub
	async #triggerHub(...args) {
		this.#eventHub.forEach(async (hubLink) => {
			hubLink.trigger?.(...args);
		});
	}
	// Messages from hub
	async sendToServer(event, ...args) { 
		// this.#socklog(`socket: sending ${event} to server`);
		this.socket.send(event, ...args);
	}

	#socklog = (msgs, style='log') => {
		msgs = Array.isArray(msgs) ? msgs : [msgs];
		if (this.#debug && console[style]) {
			// console[style](...msgs);
			this.#triggerHub('socketLog', { msgs: msgs, style: style });
		}
	};	
}