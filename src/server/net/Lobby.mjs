import { fetchRulesets, loadRuleset } from '../core/rulesets/list.mjs';
import { helpers } from '../../shared/helpers.mjs';

export class Lobby {

	#maxPlayers = 8;
	#ruleset = null;
	#rulesetOptions = {};
	#playerList = {};
	#houseList = [];
	#houseAvailable = [];
	#lobbyState;

	#setLobbyState(newState) {
		const states = {
			INIT: 'INIT',
			OPEN: 'OPEN',
			FULL: 'FULL',
			SUBMIT: 'SUBMIT'
		}
		this.#lobbyState = states[newState] ?? this.#lobbyState;
	}
	getLobbyState() { return this.#lobbyState }

	#setNumPlayers(newMax) {
		const allowedValues = Array(this.#maxPlayers).fill().map((_,i) => i+1);
		if (allowedValues.includes(newMax)) {
			this.#maxPlayers = newMax;
			console.log(`Lobby player limit set: ${this.#maxPlayers}`);
			return newMax;
		} else return 0;
	}
	
	#setRuleset(ruleset) {
		if (this.#ruleset) return console.warn('Ruleset already selected.');
		let playerLimitSet = this.#setNumPlayers(ruleset.maxPlayers);
		if (playerLimitSet) {
			console.log('setting ruleset');
			this.#ruleset = ruleset;
			return 1;
		} else {
			console.error('Illegal player limit passed to Lobby.');
			return 0;
		}
	}

	#setHouses(houseList) {
		// do stuff
	}
	#setHousesAvailable() {
		// do stuff
	}

	#updateOptions(options) {
		console.log(`Updating Lobby ruleset options`);
		Object.assign(this.#rulesetOptions, options);
	}
	

	async #getRulesetList() {
		let filenames = await fetchRulesets();
		console.log(filenames);
		this.rulesetList = filenames.map(f => {	return { id: f, name: helpers.emproper(f)} });
	}

	constructor(parentServer) {
		this.name = parentServer.name;
		this.host = parentServer.host;
		this.ruleset = null;
		this.maxPlayers = null;
		this.rulesetList = [];
		this.#setLobbyState('INIT');
		this.addPlayer(parentServer.host.pid);
	}

	// Initial lobby data for Host setup
	async initLobbyData() {
		await this.#getRulesetList();
		let output = {
			lobby: {
				title: this.name,
				init: 1
			},
			init: {
				rulesets: this.rulesetList,
				maxPlayers: Array(this.#maxPlayers).fill().map((_,i) => i+1)
			}
		};
		// Validation
		return output
	}

	// Lobby data once setup & OPEN
	async openLobbyData() {

	}

	// Update lobby instance on player/host action
	async updateLobby({ pid, type, data }) {
		if (type === 'init' && pid === this.host.pid) {
			if (!data.ruleset || isNaN(data.maxPlayers)) return new Error(`${this.name}: Incomplete init data received by lobby`);

		}
	}

	// Add a player
	// TODO: verify with server that player is connected? Shouldn't be needed???
	addPlayer(playerData) {
		if (!/[A-Za-z]_[A-Za-z0-9]{18}/.test(playerData.pid)) return new Error(`${this.name}: Bad pid received by addPlayer()`);
		let isHost = playerData.pid === this.host.pid ? true : false;
		if (this.#playerList[playerData.pid]) {
			// TODO: handle a reconnecting player???
			return new Error(`Player already exists!`);
		}
		this.#playerList[playerData.pid] = {
			playerName: playerData.playerName,
			pid: playerData.pid,
			isHost: isHost,
			house: null,
		}
	}

}