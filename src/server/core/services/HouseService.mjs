/**
 * Logic services for backend House implementation
 * 
 */

export class HouseService {

  #houseRepository = {};

  constructor(houseRepository) {
    this.#houseRepository = houseRepository;
  }

  // Generate a house id for each player
  generateHouseIds(playerList) {
    const output = {};
    let increment = 1;
    for (let p in playerList) {
      const pid = playerList[p].pid, houseInitial = playerList[p].house[0];
      const hid = `${pid[0]}${houseInitial}_${increment}${pid.slice(2)}`.slice(0,19);
      Object.assign(output, { [pid]: hid });
      increment ++;
    }
    return output;
  }

  // Generate a player dot around the map. Represents the "angle" at which players are "sitting" around
  // the 18 sectors. The player in front of the storm marker (clockwise) goes first on each round.
  generatePlayerDots(numPlayers, sectors) {
		const stormSectors = sectors ?? 18;
		const dotProgression = stormSectors/(numPlayers);
		const dots = [];
		for (let i=0; i<numPlayers; i++) { dots.push(i*dotProgression); }
		return dots;
	}

}