// core game state maintained by server
import { HouseList } from "./HouseList.mjs";
import { RoundController } from "./RoundController.mjs";
import { slog } from "../serverHub.mjs";

export class DuneCore {

	#coreState = '';
	#validCoreStates = { INIT: 'INIT', READY: 'READY', BUSY: 'BUSY', AWAIT_PLAYER: 'AWAIT_PLAYER', ERROR: 'ERROR', PLAYER_DISCONNECT: 'PLAYER_DISCONNECT' };

	#houses = {};
	#playerList = {}; // Core should only interact with Houses, not directly with Players

	#board = {}; // Store status of all tokens on the map
	#trays = {}; // Store status of all tokens in player trays/hands

	#roundController;

	#turnCounter = 0;
	#turnLimit;
	
	constructor(seed) {
		this.#setCoreState('INIT');
		this.#houses = new HouseList(seed.playerList, seed.ruleset);
		this.#roundController = new RoundController(seed.ruleset);
		this.#turnLimit = seed.turnLimit > 0 ? seed.turnLimit : 15;
		this.name = 'New Dune Game';
	}

	#setCoreState(newState) { this.#coreState = this.#validCoreStates[newState] ?? this.#coreState;	slog(`Core state set to "${this.coreState}"`); }
	get coreState() { return this.#coreState }

	get houseList() { return this.#houses.houseList }

}