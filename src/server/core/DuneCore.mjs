// core game state maintained by server
import { HouseList } from "./HouseList.mjs";
import { RoundController } from "./RoundController.mjs";
import { CardDeckController } from "./CardDeckController.mjs";
import { DuneMap } from "./DuneMap.mjs";
import { slog } from "../serverHub.mjs";

export class DuneCore {

	#coreState = '';
	#validCoreStates = { INIT: 'INIT', READY: 'READY', BUSY: 'BUSY', AWAIT_PLAYER: 'AWAIT_HOUSE', ERROR: 'ERROR', PLAYER_DISCONNECT: 'PLAYER_DISCONNECT' };

	#rulesetName = '';
	#validator = {}; // Validate PlayerTurn on submission

	#houses = {};
	// #playerList = {}; // Core should only interact with Houses, not directly with Players

	#duneMap = {};

	#board = {}; // Store status of all tokens on the map
	#trays = {}; // Store status of all tokens in player trays/hands.

	#cards = {}; // Store status of all card decks & cards

	#roundController = {};

	#turnCounter = 0;
	#turnLimit;
	
	constructor(seed) {
		this.#setCoreState('INIT');
		this.#houses = new HouseList(seed.playerList, seed.ruleset);
		this.#roundController = new RoundController(seed.ruleset);
		this.#cards = new CardDeckController(seed.ruleset.decks, seed.serverOptions);
		this.#turnLimit = seed.turnLimit > 0 ? seed.turnLimit : 15;
		this.#duneMap = new DuneMap();
		this.#rulesetName = seed.name;
		this.name = seed.name || 'New Dune Game';
		this.host = seed.host;
		this.#initBoardAndTrays();
	}

	#initBoardAndTrays() {
		for (let house in this.#houses) {
			const setup = this.#houses[house].stats;
			// Add tokens to map region
			// TODO: deal with Fremen token placement choice as a "turn 0" before proper game start
			const placedTokens = Object.entries(setup.startingPosition.placed);
			// Add other tokens to house tray
			// Add spice to house tray
		}
	}

	#setCoreState(newState) { this.#coreState = this.#validCoreStates[newState] ?? this.#coreState;	slog(`Core state set to "${this.coreState}"`); }
	get coreState() { return this.#coreState }

	get houseList() { return this.#houses.list }

	get boardState() { return this.#board }

	get trayContents() { return this.#trays }

	get listAll() {
		return {
			name: this.name,
			ruleset: this.#rulesetName,
			map: this.#duneMap.list,
			round: this.#roundController.list,
			houses: this.#houses.list,
			cards: this.#cards.list,
		}
	}

}