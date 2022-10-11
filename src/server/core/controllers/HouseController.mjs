import { slog } from "../../serverHub.mjs";
import { HouseRepository } from "../repositories/HouseRepository.mjs";
import { HouseService } from "../services/HouseService.mjs";

export class HouseController {

	#houseRepository;
  #houseService;
	
	constructor(playerList, ruleset) {
    // Initialise the Repo and Service
    this.#houseRepository = new HouseRepository();
    this.#houseService = new HouseService(this.#houseRepository);

		// slog([playerList, ruleset]);
		const numPlayers = Object.keys(playerList).length;

		// Generate house ids & player dots
		const houseIds = this.#houseService.generateHouseIds(playerList);
		const playerDots = this.#houseService.generatePlayerDots(numPlayers);

		for (let player in playerList) {
			const houseName = playerList[player].house;
			const targetHouse = ruleset.Houses[houseName];
			const houseId = houseIds[playerList[player].pid];

			slog([`Generating House setup for player ${player}: ${houseName}`, targetHouse]);

			if (!targetHouse) return new Error(`HouseList error: Could not find House "${targetHouse}"`);

      this.#houseRepository.create({
        ...targetHouse,
				hid: houseId,
				rulesetName: houseName,
				lastPlayer: playerList[player].pid,
				houseDot: playerDots.shift(),
			});
		}
	}

	all() { return this.#houseRepository.all() }

  // get listStorm() { return HouseTransformer.transformHouses(this.#houseRepository.all) }

	
}