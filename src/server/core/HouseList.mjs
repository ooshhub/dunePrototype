import { slog } from "../serverHub.mjs";
import { helpers } from "../../shared/helpers.mjs";

export class HouseList {

	#houses = {};
	
	constructor(playerList, ruleset) {
		// slog([playerList, ruleset]);
		const numPlayers = Object.keys(playerList).length;
		
		// List of House properties not needed by server
		const trimHouseProperties = ['mentat', 'ruler'];

		// Generate house ids
		const houseIds = helpers.generateHouseIds(playerList);
		const playerDots = this.#generatePlayerDots(numPlayers);

		for (let player in playerList) {
			const newHouse = {};
			const houseName = playerList[player].house;
			const targetHouse = ruleset.Houses[houseName];
			const hid = houseIds[playerList[player].pid];

			slog([`Generating House setup for player ${player}: ${houseName}`, targetHouse]);

			if (!targetHouse) return new Error(`HouseList error: Could not find House "${targetHouse}"`);
			Object.assign(newHouse, {
				hid: hid,
				rulesetName: houseName,
				lastPlayer: playerList[player].pid,
				playerDot: playerDots.shift(),
			});
			for (let prop in targetHouse) {
				if (!trimHouseProperties.includes(prop)) newHouse[prop] = targetHouse[prop];
			}
			this.#houses[hid] = newHouse;
		}
	}

	get list() { return this.#houses }

	#generatePlayerDots(numPlayers, sectors) {
		const stormSectors = sectors ?? 18;
		const dotProgression = stormSectors/(numPlayers);
		const dots = [];
		for (let i=0; i<numPlayers; i++) { dots.push(i*dotProgression); }
		return dots;
	}

	/**
	 * Required methods....
	 * - return abilities by filter, e.g. applicable to current round, applicable to current player, applicable to Alliance etc.
	 * - 
	 * 
	 * 
	 * 
	 */
	
}