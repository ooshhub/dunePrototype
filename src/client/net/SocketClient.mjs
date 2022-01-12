// socket.io client Class
// TODO: rewrite
import { io } from '../lib/socket.io.esm.min.js';
import { helpers } from '../../shared/helpers.mjs';

export class SocketClient {

	#connecting = 0;
	#debug = 1;

	constructor(clientOptions={}) {
		Object.assign(this, {
			player: {
				playerName: clientOptions.playerName || `newPlayer_${Math.floor(Math.random()*99)}`,
				pid: clientOptions.pid
			},
			serverOptions: {
				url: `http://${clientOptions.hostIp||'localhost'}:${clientOptions.hostPort||8080}`,
				path: clientOptions.path || '/',
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
			},
			extraHeaders: {
				game: 'dune',
			}
		});

		this.socket.on('message', (...args) => {
			this.#socklog(['Received server message', ...args]);
			this.#triggerHub(...args);
		});

		// TODO: Connection handling
		// Dunno what's needed
		this.socket.on('disconnect', msg => this.#socklog('===Disconnected===', msg));
		this.socket.on('connect_error', msg => this.#socklog(['ConnectionError', msg], 'error'));
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
		this.socket.on('auth', (data) => {
			// this.#socklog(`Auth received: ${data}`);
			if (!data || data.err) {
				let err = data?.err || `Unknown Error`;
				this.#socklog(`Auth rejected by server: ${err}`, 'error');
				this.socket.close();
				this.#triggerHub('authReject', err);
			} else {
				this.#socklog([`Authenticated with server, playerId is ${data}`]);
				this.player.id = data;
				this.#triggerHub('authSuccess');
			}
		});
	}

	async connectToGame(maxAttemptTime=8000) {
		if (this.#connecting === 1 || this.socket.connected) return this.#socklog(`Already connected/connecting!`, 'warn');
		this.#connecting = 1;
		this.#socklog(`Connecting...`);
		this.socket.connect();
		await helpers.timeout(maxAttemptTime);
		if (!this.socket.connected) {
			this.socket.close();
			this.#connecting = 0;
			this.#socklog(`Connection timeout, server not found or connection upgrade refused`);
		} else return 1;
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