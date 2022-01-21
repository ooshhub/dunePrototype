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
			UNKNOWN: 'UNKNOWN'
		}
		this.#state = validStates[newState] ?? this.#state;
	}

	async #updateInterfaceStatus() {
		if (!$('main#mainmenu')) return rlog(`SessionState: failed to find Document`, 'error');
		this.#store.ui.shown = Array.from($$('.show'))?.map(el => { if (el.id) return `${el.tagName}#${el.id}` });
		this.#store.ui.hidden = Array.from($$('.hide'))?.map(el => { if (el.id) return `${el.tagName}#${el.id}` });
	}
	async #updateServerStatus() {
		if (!window.Dune?.Client?.player) return rlog(`SessionState: failed to find server info on SocketClient`, 'warn');
		Object.assign(this.#store.server, window.Dune.Client.serverOptions);
	}
	async #updatePlayerStatus() {
		if (!window.Dune.ActivePlayer?.pid) return rlog(`SessionState: failed to find player details`, 'error');
		Object.assign(this.#store.player, window.Dune.ActivePlayer);
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
		this.player = playerData;
		this.#setSessionState('MENU');
		this.#store.ui.shown.push('main#mainmenu');
	}

	restore(previousSession) {
		if (typeof(previousSession) === 'string')	try { previousSession = JSON.parse(previousSession) } catch(e) { rlog(['SessionState: error parsing previous state',e], 'error') }
		rlog(['Restoring session...', previousSession]);
		let { state, store } = previousSession;
		if (state && store?.player?.pid) Object.assign(this.#store, store);
		this.#setSessionState(state);
	}

	async update(state, component='all', save=true) {
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
		return output;
	}

	getSessionState() { return this.#state }

}