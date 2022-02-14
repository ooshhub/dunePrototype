// Round controller
import { GameRound } from "./rounds/Round.mjs";
// import { slog } from "../serverHub.mjs";

export class RoundController {

	#defaultRounds = ['storm', 'spiceBlow', 'bidding', 'movement', 'battle', 'collection'];

	#hidList = [];
	#dotList = [];
	#turnOrder = [];

	#rounds = [];

	#currentRound = {};
	
	constructor(ruleset, houseList) {
		this.name = ruleset.name || 'defaultRounds';
		if (ruleset.custom) {
			// Custom ruleset constructor
		} else {
			this.#defaultRounds.forEach((round) => {
				const newRound = new GameRound(round);
				if (newRound) this.#rounds[newRound.index] = newRound;
			});
			// TODO: validate round indices to ensure contiguous numbers

		}
		// Grab data for PlayerTurn order
		for (let h in houseList) {
			this.#hidList.push(h);
			this.#dotList.push(houseList[h].playerDot);
		}
		// Can't remember if the storm starts at 0 or not
		this.#determineTurnOrder(0);
	}

	get list() { return Array.from(this.#rounds) }

	get current() { return this.#currentRound }

	// Push to next round. Probably make private method.
	async next() {
		await this.#currentRound.endRound();
		this.#currentRound = this.#rounds[(this.#currentRound.index + 1) % this.#rounds.length];
		await this.#currentRound.startRound();
		return 1;
	}

	#determineTurnOrder(stormPosition) {
		const nearestIndex = this.#dotList.findIndex(v => v >= stormPosition), newOrder = [];
		if (this.#dotList[nearestIndex] === stormPosition) {
			return nearestIndex;
		} else {
			// If nearest Player marker is a Float, roll to see who goes first. Biased according to decimal.
			const splitRoll = Math.random();
			const playerOneIndex = splitRoll > this.#dotList[nearestIndex]%1 ? nearestIndex : nearestIndex - 1;
			newOrder.push(this.#hidList.splice(playerOneIndex, this.#hidList.length - playerOneIndex).concat(this.#hidList));
			return newOrder;
		}
	}

}