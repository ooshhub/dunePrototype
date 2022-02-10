import { slog } from "../serverHub.mjs";
import { helpers } from "../../shared/helpers.mjs";

export class HouseList {

	#houses = {};
	
	constructor(playerList, ruleset) {
// ruleset.Houses[housename]
		slog([playerList, ruleset]);
		// List of House properties not needed by server
		const trimHouseProperties = ['mentat', 'ruler'];

		// Generate house ids
		const houseIds = helpers.generateHouseIds(playerList);

		for (let player in playerList) {
			const newHouse = {};
			const houseName = playerList[player].house;
			const targetHouse = ruleset.Houses[houseName];
			const hid = houseIds[playerList[player].pid];

			slog([`Generating House setup for player ${player}: ${houseName}`, targetHouse]);

			if (!targetHouse) return new Error(`HouseList error: Could not find House "${targetHouse}"`);
			newHouse.hid = hid;
			newHouse.rulesetName = houseName;
			newHouse.lastPlayer = playerList[player].pid;
			for (let prop in targetHouse) {
				if (!trimHouseProperties.includes(prop)) newHouse[prop] = targetHouse[prop];
			}
			this.#houses[hid] = newHouse;
		}
	}

	get houseList() { return this.#houses }

	/**
	 * Required methods....
	 * - return abilities by filter, e.g. applicable to current round, applicable to current player, applicable to Alliance etc.
	 * - 
	 * 
	 * 
	 * 
	 */
	
}