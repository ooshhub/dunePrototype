// core game state maintained by server
import { HouseList } from "./HouseList.mjs";
import { RoundController } from "./RoundController.mjs";
import { CardDeckController } from "./CardDeckController.mjs";
import { slog } from "../serverHub.mjs";

export class DuneCore {

	#coreState = '';
	#validCoreStates = { INIT: 'INIT', READY: 'READY', BUSY: 'BUSY', AWAIT_PLAYER: 'AWAIT_HOUSE', ERROR: 'ERROR', PLAYER_DISCONNECT: 'PLAYER_DISCONNECT' };

	#rulesetName = '';

	#houses = {};
	// #playerList = {}; // Core should only interact with Houses, not directly with Players

	#map = {};

	#board = {}; // Store status of all tokens on the map
	#trays = {}; // Store status of all tokens in player trays/hands

	#cards = {}; // Store status of all card decks & cards

	#roundController;

	#turnCounter = 0;
	#turnLimit;
	
	constructor(seed) {
		this.#setCoreState('INIT');
		this.#houses = new HouseList(seed.playerList, seed.ruleset);
		this.#roundController = new RoundController(seed.ruleset);
		this.#cards = new CardDeckController(seed.decks, seed.serverOptions);
		this.#turnLimit = seed.turnLimit > 0 ? seed.turnLimit : 15;
		this.#map = new DuneMap();
		this.#rulesetName = seed.name;
		this.name = 'New Dune Game';
	}

	#setCoreState(newState) { this.#coreState = this.#validCoreStates[newState] ?? this.#coreState;	slog(`Core state set to "${this.coreState}"`); }
	get coreState() { return this.#coreState }

	get houseList() { return this.#houses.list }

	get listAll() {
		return {
			name: this.name,
			ruleset: this.#rulesetName,
			map: this.#map.list,
			round: this.#roundController.list,
			houses: this.#houses.list,
			cards: this.#cards.list,
		}
	}

}