import { fetchRulesets, loadRuleset } from '../core/rulesets/list.mjs';
import { Helpers } from '../../shared/Helpers.mjs';
import { slog } from '../serverHub.mjs';

export class Lobby {

	#maxPlayers = 8;
	#numPlayers = 2;
	#ruleset = null;
	#rulesetOptions = {};
	#playerList = {};
	#houseList = [];
	#houseAvailable = [];
	#lobbyState;

	constructor(parentServer) {
		this.name = parentServer.name;
		this.host = parentServer.host;
		this.host.index = 1; // set host to player 1
		this.ruleset = null;
		this.maxPlayers = null;
		this.rulesetList = [];
		this.#setLobbyState('INIT');
	}

	#setLobbyState(newState) {
		const states = {
			INIT: 'INIT',
			AWAIT_HOST: 'AWAIT_HOST',
			OPEN: 'OPEN',
			FULL: 'FULL',
			SUBMIT: 'SUBMIT'
		}
		this.#lobbyState = states[newState] ?? this.#lobbyState;
		slog(`Lobby state is now ${this.#lobbyState}`);
	}
	getLobbyState() { return this.#lobbyState }

	#setNumPlayers(newMax) {
		newMax = parseInt(newMax) || null;
		const allowedValues = Array(this.#maxPlayers).fill().map((_,i) => i+1);
		if (allowedValues.includes(newMax)) {
			this.#numPlayers = newMax;
			slog(`Lobby player limit set: ${this.#numPlayers}`);
			return newMax;
		} else return 0;
	}
	
	#setRuleset(Ruleset) {
		let err;
		// slog(Ruleset);
		['name', 'availableHouses', 'map', 'serverOptions', 'Houses'].forEach(k => { if (Ruleset[k] == null) err = `Bad ruleset data`; });
		Ruleset.availableHouses?.forEach(h => {	if (!Ruleset.Houses?.[h]) err = `Missing house ${h}`	});
		if (err) return new Error(err);
		this.#houseList = Ruleset.availableHouses;
		this.#houseAvailable = this.#houseList;
		this.#ruleset = Ruleset;
		this.#rulesetOptions = Ruleset.serverOptions;
		for (let opt in this.#rulesetOptions) this.#rulesetOptions[opt].value = this.#rulesetOptions[opt].default;
		return 1;
	}

	#setHousesAvailable() {
		// do stuff
	}

	#getPlayerIndex() {
		let takenIndices = Object.keys(this.#playerList);
		let availableSlots = Array(this.#numPlayers-1).fill().map((_,i) => {
			if (i+2 <= this.#numPlayers && !takenIndices.includes(i+2)) return i+2;
		}).filter(v=>v);
		if (availableSlots.length === 1) {
			this.#setLobbyState('FULL');
			slog(`Lobby is full!`);
		} else if (!availableSlots.length) {
			this.#setLobbyState('FULL');
			// reject player that tried to join
			// path shouldn't happen anyway
			return;
		}
		return availableSlots[0];
	}

	#updateOptions(optionData) {
		slog(['option data update:', optionData]);
		let validKeys = Object.keys(this.#rulesetOptions);
		if (validKeys.includes(optionData.name)) {
			slog('updating settings');
			this.#rulesetOptions[optionData.name].value = optionData.value;
		}
		slog(this.#rulesetOptions);
		return { serverOptions: optionData };
	}

	// Add a player
	#addPlayer(playerData) {
		let state = this.getLobbyState();
		if (!/(await|open)/i.test(state)) return new Error(`Lobby is not open`);
		if (!/[A-Za-z]_[A-Za-z0-9]{18}/.test(playerData.pid)) return new Error(`${this.name}: Bad pid received by addPlayer()`);
		let isHost = playerData.pid === this.host.pid ? true : false;
		if (this.#playerList[playerData.pid]) {
			// TODO: handle a reconnecting player???
			return new Error(`Player already exists!`);
		}
		if (state === 'AWAIT_HOST' && !isHost) return new Error('Host has not joined yet...');
		playerData.index = isHost ? 1 : this.#getPlayerIndex();
		if (!playerData.index) return slog(`Couldn't get player slot - server full???`);
		this.#playerList[playerData.index] = {
			playerName: playerData.playerName,
			pid: playerData.pid,
			isHost: isHost,
			house: null,
		}
		return { playerData };
	}

	#updatePlayer(updateData = {}, pid) {
		let err;
		if (!updateData.index || !this.#playerList[updateData.index]) err = slog(`Player ${pid} does not exist in Lobby`, 'error');
		if (pid !== this.#playerList[updateData.index].pid) err = slog([`pid mismatch between Lobby and requestor`, updateData], 'warn');
		if (!err) {
			// key names will match the HTML names e.g. name="house-3" is name: house, index: 3
			const keyNames = ['house', 'color', 'ready'];
			if (keyNames.includes(updateData.name)) {
				// Set default house color if player hasn't yet changed it
				if (updateData.name === 'house' && (!this.#playerList[updateData.index].color || !this.#rulesetOptions.customColor.value)) {
					const defColor = this.#ruleset.Houses[updateData.value]?.defaultColor;
					slog(`House defCol: ${defColor}`);
					if (/#[\dA-Fa-f]{6}/.test(defColor)) this.#playerList[updateData.index].color = defColor;
				}
				this.#playerList[updateData.index][updateData.name] = updateData.value;
				return { update: { index: updateData.index, data: this.#playerList[updateData.index] } };
			} else return new Error(`Player option does not exist: "${updateData.name}"`);
		} else return new Error(err);
	}

	#removePlayer(pid) {
		let playerToRemove;
		for (let p in this.#playerList) {
			if (this.#playerList[p].pid === pid) {
				playerToRemove = p;
				this.#playerList[p] = { pid: null, playerName: '', color: '#dddddd' };
			}
		}
		return playerToRemove ? 1 : 0;
	}
	
	async #getRulesetList() {
		let filenames = await fetchRulesets();
		// console.log(filenames);
		this.rulesetList = filenames.map(f => {	return { id: f, name: Helpers.emproper(f)} });
	}

	#getLobbyData() {
		if (!this.#ruleset) return slog(`No ruleset found in Lobby`, 'error');
		return {
			lobby: {
				init: 0,
				title: this.name,
				players: Array(this.#numPlayers).fill().map((_,i) => i+1),
				ruleset: this.#ruleset.name,
				// TODO: This can go, once the House data is attached to client window
				houses: this.#houseList.map(hs => {
					return {
						id: hs,
						name: this.#ruleset.Houses[hs].name,
						displayName: this.#ruleset.Houses[hs].displayName,
						defaultColor: this.#ruleset.Houses[hs].defaultColor,
					}
				}),
			},
			host: this.host,
			serverOptions: this.#ruleset.serverOptions,
		};
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

	// Setup lobby
	async setupLobby(ruleset, players) {
		slog(`Setting up lobby...`);
		let err;
		let Ruleset = await loadRuleset(ruleset);
		if (Ruleset) {
			let rulesetResult = this.#setRuleset(Ruleset);
			if (!rulesetResult.stack) {
				let playerLimit = this.#setNumPlayers(players);
				if (!playerLimit) err = `Couldn't set player limit`;
			} else err = rulesetResult;
		} else err = `Failed to load ruleset`;
		if (err) return (err.stack) ? err : new Error(err);
		let lobby = this.#getLobbyData();
		this.#setLobbyState('AWAIT_HOST');
		let addHost = this.#addPlayer(this.host);
		if (addHost.stack) return addHost;
		else return { lobbyData: lobby, playerData: { 1: this.host }, initFlag: true, houseData: this.#ruleset?.Houses }
	}

	openLobby() { this.#setLobbyState('OPEN') }

	async playerJoin(playerData) {
		let joinSuccess = await this.#addPlayer(playerData);
		if (!joinSuccess.stack) return this.getLobby();
		else return joinSuccess;
	}

	playerQuit(pid) {
		slog(`Player ${pid} quit lobby.`);
		if (this.#removePlayer(pid)) return this.getLobby();
	}

	// Get lobby data
	getLobby() { return { lobbyData: this.#getLobbyData(), playerData: this.#playerList, houseData: this.#ruleset?.Houses, canLaunch: this.arePlayersReady() }	}

	// Update lobby instance on player/host action
	updateLobby(type, data, pid) {
		let result = (type === 'updateOptions' && pid === this.host.pid) ? this.#updateOptions(data)
			: (type === 'addPlayer') ? this.#addPlayer(data, pid)
			: (type === 'updatePlayer') ? this.#updatePlayer(data, pid)
			: null;
		result.canLaunch = this.arePlayersReady();
		return result ? result : new Error(`No update type received`);
	}

	getPlayerCount() {
		let players = 0;
		for (let p in this.#playerList) {
			if (this.#playerList[p].pid) players ++;
		}
		return players;
	}

	arePlayersReady() {
		const players = this.getPlayerCount();
		// DISABLED FOR TESTING
		// if (players < 2) return false;
		let ready = 0;
		for (let p in this.#playerList) {
			if (this.#playerList[p].ready) ready++;
		}
		if (players === ready) return true;
		else return false;
	}

	validateLobby() {
		if (!['OPEN','FULL'].includes(this.getLobbyState())) return new Error(`Lobby is not ready: "${this.getLobbyState()}"`);
		if (!this.arePlayersReady()) return new Error(`All players must be ready`);
		slog([`Lobby options: `, this.#rulesetOptions, this.#playerList]);
		// TODO: validation process
		return true;
	}

	generateGameSeed() {
		this.#setLobbyState('SUBMIT');
		const seed = {
			name: this.name,
			host: this.host,
			playerList: this.#playerList,
			ruleset: this.#ruleset,
			options: this.#rulesetOptions
		}
		return seed;
	}

}