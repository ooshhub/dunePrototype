// the window.Dune object, holds a mix of data from CONFIG reference values, to live Pixi token data
// 

import { helpers } from '../shared/helpers.mjs';
import { Serialiser } from '../shared/Serialiser.mjs';

export class DuneStore {

	// Permanent features of the DuneStore
	#pid = null;
	#houses = {};
	#players = {};
	#board = {};
	#tray = {};
	#session = null;
	#config = null;
	#eventHub = null;
	#logger = () => {};

	constructor(storeConfig = {}) {
		Object.assign(this, {
			name: storeConfig.name || 'Dune Client Store',
		});
	}

	// Probably only exposed for debug. Try not to reference this in other code.
	//TODO: move client to private method, is referenced a lot
	layers = {};
	client = null;
	helpers = helpers;

	get pid() { this.#pid = this.#config?.userSettings?.player?.pid || ''; return this.#pid }
	get currentPlayer() { return (this.pid && this.#players) ? this.#players[this.pid] : null }
	get currentHouse() { return (this.#pid && this.#houses) ? Object.entries(this.#houses).map(h=> h[1]?.pid === this.#pid ? h[1] : null).filter(v=>v)[0] : null }
	get houses() { return this.#houses } // Probably do something here with some ID replacing or some shit for ease of reading logs
	get players() { return this.#players } // Same again?
	get config() { return this.#config } // Has no methods on it, and no setter. Reference values only.
	get session() { return this.#session } // Access through class methods
	get renHub() { return this.#eventHub }	// Access through class methods

	// Setters only work once to initialise object
	set config(data) { { this.#config = (this.#config === null && data.PATH) ? data : this.#config } }
	set session(newSession) { this.#session = (this.#session === null && newSession.constructor?.name === 'SessionState') ? newSession : this.#session }
	set renHub(newHub) { this.#eventHub = (this.#eventHub === null && newHub.constructor.name === 'EventHub') ? newHub : this.#eventHub }
	set logger(logFunction) { this.#logger = typeof(logFunction) === 'function' ? logFunction : console.log }

	// Serialiser data
	get appendFields() { return { _houses: this.#houses, _players: this.#players, _session: this.#session, _config: this.#config, _eventHub: this.#eventHub } }

	// Updates for dynamic game data
	// TODO: add validation to each data type
	#updateHouses(data) {
		for (const house in data) { Object.assign(this.#houses[house], data[house]) }
		this.log(`${this.name}: updated Houses`);
	}
	#updatePlayers(data) {
		for (const player in data) { Object.assign(this.#players[player], data[player]) }
		this.log(`${this.name}: updated Players`);
	}
	#updateBoard(data) {
		Object.assign(this.#board, data);
		this.log(`${this.name}: updated Board`);
	}
	#updateTray(data) {
		Object.assign(this.#tray, data);
		this.log(`${this.name}: updated Tray`);
	}

	// Exposed update path
	update(targetProperty, data={}) {
		const targetArray = targetProperty === 'all' ? Object.keys(data) : helpers.toArray(targetProperty);
		targetArray.forEach(target => {
			const dataRef = data[target] ?? data;
			switch(target) {
				case "houses":
					this.#updateHouses(dataRef);
					break;
				case "players":
					this.#updatePlayers(dataRef);
					break;
				case "board":
					this.#updateBoard(dataRef);
					break;
				case "tray":
					this.#updateTray(dataRef);
					break;
				default: 
					console.warn(`${this.name}: Unrecognised update property/data write attempt: ${target}`);
			}
		});
	}

	log(...args) { this.#logger(...args) }

	list() {	console.info(Serialiser.serialise(this)); }

}