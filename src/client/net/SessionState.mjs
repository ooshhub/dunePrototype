/* */
import { rlog } from '../rendererHub.mjs';
import { helpers } from '../../shared/helpers.mjs';

export class SessionState {

	#updated;
	#sessionId;
	#state;
	#store;

	#setSessionState(newState) {
		const validStates = {
			MENU: 'MENU',
			LOBBY: 'LOBBY',
			GAME: 'GAME',
			ERROR: 'ERROR',
			UNKNOWN: 'UNKNOWN',
			RESTORING: 'RESTORING'
		}
		this.#state = validStates[newState] ?? this.#state;
	}

	async #updateInterfaceStatus() {
		if (!$('main#mainmenu')) return rlog(`SessionState: failed to find Document`, 'error');
		this.#store.ui.shown = Array.from($$('.show'))?.map(el => { if (el.id) return `${el.tagName}#${el.id}` });
		this.#store.ui.hidden = Array.from($$('.hide'))?.map(el => { if (el.id) return `${el.tagName}#${el.id}` });
		// rlog(this.#store.ui);
	}
	async #updateServerStatus() {
		if (!window.Dune?.client?.player) return rlog(`SessionState: failed to find server info on SocketClient`, 'warn');
		Object.assign(this.#store.server, window.Dune.client.serverOptions);
	}
	async #updatePlayerStatus() {
		if (!window.Dune.currentPlayer) return rlog(`SessionState: failed to find player details`, 'error');
		Object.assign(this.#store.player, window.Dune.currentPlayer);
	}

	async #saveToStorage() {
		let payload = { state: this.getSessionState(), store: this.#store };
		window.sessionStorage.setItem('DuneSession', JSON.stringify(payload));
		rlog(`SessionState: session stored.`);
	}
	
	// Change to sessionId later
	constructor() {
		this.#updated = Date.now();
		this.#store = {
			player: {},
			ui: {
				active: null, // Not needed??? State & hidden/shown should cover this.
				hidden: [],
				shown: [],
			},
			server: {
				url: null,
				path: '',
				password: '',
			},
			house: {
				houseName: null,
				hid: null
			},
		};
		helpers.bindAll(this);
	}

	init(playerData) {
		this.#store.player = playerData;
		this.#setSessionState('MENU');
		this.#store.ui.shown.push('main#mainmenu');
	}

	async restore(previousSession) {
		this.#setSessionState('RESTORING');
		// rlog(['Restoring session...', previousSession]);
		const { state, store } = JSON.parse(previousSession);
		// rlog([`Store:`, store]);
		// try { sessionObj = JSON.parse(previousSession) } catch(e) { rlog(['SessionState: error parsing previous state',e], 'error') }
		// let { state, store } = sessionObj;
		// rlog(state, store);
		if (state && store?.player?.pid) Object.assign(this.#store, JSON.parse(previousSession).store);
		let returnData = { state: state, store: store, reconnect: this.getServerReconnectObject() }
		this.#setSessionState(`${state}`);
		return returnData;
	}

	async update(state, component='all', save=true) {
		if (this.getSessionState() === 'RESTORING') return;
		let queue = [];
		if (component === 'all' || component === 'ui') queue.push(this.#updateInterfaceStatus.bind(this));
		if (component === 'all' || component === 'server') queue.push(this.#updateServerStatus.bind(this));
		if (component === 'all' || component === 'player') queue.push(this.#updatePlayerStatus.bind(this));
		if (queue.length) {
			await Promise.all(queue.map(async (fn) => fn()));
			this.#updated = Date.now();
		}
		if (state) this.#setSessionState(state);
		if (save) this.#saveToStorage();
	}

	setServerStatus(connected, token) {
		if (connected) {
			this.#store.server.sessionToken = token;
			this.#store.reconnect = 1;
		} else {
			this.#store.server.sessionToken = null;
			this.#store.reconnect = 0;
		}
		this.update();
	}

	lastUpdate() { return this.#updated } // Needed at all???

	getStore() { return { store: this.#store } }
	getInterfaceStatus() { return { hidden: this.#store.ui.hidden||[], shown: this.#store.ui.shown||[] } }
	getServerStatus() { return { server: this.#store.server } }
	getPlayerStatus() { return { player: this.#store.player } }
	
	getServerReconnectObject() {
		let s = this.getServerStatus(),
				p = this.getPlayerStatus(),
				output = {};
		Object.assign(output, s.server, p.player);
		output.reconnect = this.#store.reconnect;
		return output;
	}

	getSessionState() { return this.#state }

}