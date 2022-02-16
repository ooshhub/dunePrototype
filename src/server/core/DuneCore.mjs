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

	#board = { regions: {} }; // Store status of all tokens on the map
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
		this.#board.regions = this.#duneMap.regionList;
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
			const placedTokens = Object.entries(setup.startingPosition.placed) ?? [];
			let reserveTokens = setup.soldiers || 20;
			placedTokens.forEach(p => {
				if (this.#duneMap.isRegion(p[0])) {
					// Might need to do another turn 0 to deal with elite troop placement?
					const placedSoldiers = p[1];
					this.#board.regions[p[0]][house] = { soldiers: placedSoldiers }
					reserveTokens -= placedSoldiers;
				}
			});
			// Add other tokens to house tray
			this.#addToTray({ hid: house, type: 'soldier', quantity: reserveTokens });

			// Add spice to house tray
		}
	}

	#setCoreState(newState) { this.#coreState = this.#validCoreStates[newState] ?? this.#coreState;	slog(`Core state set to "${this.coreState}"`); }
	get coreState() { return this.#coreState }

	isHouse(hid) { return this.#houses[hid] ? true : false }

	// add to a house tray, { hid: houseId, type: solder/leader/etc, quantity: 1 }
	#addToTray( hid, {  }) {
		if (!this.isHouse(hid)) return slog(`coreError: house ${hid} does not exist`, 'error');
		if (!)
	}

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