// core game state maintained by server
import { HouseList } from "./HouseList.mjs";
import { RoundController } from "./RoundController.mjs";
import { slog } from "../serverHub.mjs";

export class DuneCore {

	#coreState = '';
	#validCoreStates = { INIT: 'INIT', READY: 'READY', BUSY: 'BUSY', AWAIT_PLAYER: 'AWAIT_PLAYER', ERROR: 'ERROR' };

	#houseList = {};
	#playerList = {}; // Core should only interact with Houses, not directly with Players

	#roundController;
	#roundState;
	#turnCounter = 0;
	#turnLimit;
	
	constructor(seed) {
		this.#setCoreState('INIT');
		this.#houseList = new HouseList(seed.playerList);
		this.#roundController = new RoundController(seed.ruleset);
		this.#turnLimit = seed.turnLimit || 15;
		this.name = 'New Dune Game';
	}

	#setCoreState(newState) { this.#coreState = this.#validCoreStates[newState] ?? this.#coreState;	slog(`Core state set to "${this.coreState}"`); }

	get coreState() { return this.#coreState }

}