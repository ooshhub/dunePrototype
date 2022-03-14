// core game state maintained by server
import { HouseList } from "./HouseList.mjs";
import { RoundController } from "./RoundController.mjs";
import { CardDeckController } from "./CardDeckController.mjs";
import { DuneMap } from "./DuneMap.mjs";
import { slog } from "../serverHub.mjs";
import { helpers } from "../../shared/helpers.mjs";

export class DuneCore {

	#coreState = '';
	#validCoreStates = { INIT: 'INIT', READY: 'READY', BUSY: 'BUSY', AWAIT_PLAYER: 'AWAIT_HOUSE', ERROR: 'ERROR', PLAYER_DISCONNECT: 'PLAYER_DISCONNECT' };

	#rulesetName = '';
	#validator = {}; // Validate PlayerTurn on submission

	#houses = {};
	// #playerList = {}; // Core should only interact with Houses, not directly with Players

	#duneMap = {};

	#board = {}; // Store status of all tokens on the map
	#tanks = {}; // Store status of all tokens in Tleilaxu Tanks
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
		this.#duneMap.regionList.forEach(r => this.#board[r] = {});
		this.#rulesetName = seed.name;
		this.name = seed.name || 'New Dune Game';
		this.host = seed.host;
		this.#initBoardAndTrays();
	}

	#initBoardAndTrays() {
		for (let house in this.#houses) {
			// slog(`Setting up ${house}...`);
			const setup = this.#houses[house].stats;
			// Add tokens to map region
			// TODO: deal with Fremen token placement choice as a "turn 0" before proper game start
			const placedTokens = Object.entries(setup.startingPosition.placed) ?? [];
			let startSoldiers = setup.soldiers || 20;
			placedTokens.forEach(p => {
				if (this.#duneMap.isRegion(p[0])) {
					// Might need to do another turn 0 to deal with elite troop placement?
					const placedSoldiers = p[1];
					this.#board[p[0]][house] = { soldiers: placedSoldiers }
					startSoldiers -= placedSoldiers;
				}
			});
			// Set up tray
			this.#trays[house] = { soldiers: 0, elites: 0, spice: 0, leaders: [] };
			// Add other tokens to house tray
			let tokenArray = [
				{ type: 'soldiers', quantity: startSoldiers },
				{ type: 'elites', quantity: setup.eliteSoldiers ?? 0 },
				{ type: 'spice', quantity: setup.startingSpice }
			];
			this.#houses[house].leaders.forEach(leader => {
				tokenArray.push({
					type: 'leaders',
					quantity: 1,
					data: leader
				});
			});
			slog([`Sending array to house tray:`, tokenArray]);
			this.#modifyTray(house, tokenArray);
		}
		slog([`Finished setting up trays`, this.#trays]);
	}

	#setCoreState(newState) { this.#coreState = this.#validCoreStates[newState] ?? this.#coreState;	slog(`Core state set to "${this.coreState}"`); }
	get coreState() { return this.#coreState }

	isHouse(hid) { return this.#houses[hid] ? true : false }

	// add to a house tray, hid: houseId, { type: solder/leader/etc, quantity: 1 }
	#modifyTray(hid, tokenArray) {
		if (!this.#trays[hid]) return slog(`coreError: house ${hid} does not exist`, 'error');
		tokenArray = helpers.toArray(tokenArray);
		tokenArray.forEach(tok => {
			if (this.#trays[hid][tok.type] != null && tok.quantity > -1) {
				if (tok.type === 'leaders') {
					if (tok.quantity > 0) this.#trays[hid].leaders.push(tok.data);
					else {
						const idx = this.#trays.leaders.findIndex(ldr => ldr.id === tok.data.id);
						this.#trays.leaders.splice(idx, 1);
					}
				} else {
					this.#trays[hid][tok.type] += tok.quantity;
				}
			} else slog([`trayError: bad token input`, tok]);
		});
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