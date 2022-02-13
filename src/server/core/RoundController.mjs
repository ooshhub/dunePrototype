// Round controller
import { GameRound } from "./rounds/Round.mjs";
// import { slog } from "../serverHub.mjs";

export class RoundController {

	#defaultRounds = ['storm', 'spiceBlow', 'bidding', 'movement', 'battle', 'collection'];

	#rounds = [];

	#currentRound = {};
	
	constructor(ruleset) {
		this.name = ruleset.name || 'defaultRounds';
		if (ruleset.custom) {
			// Custom ruleset constructor
		} else {
			this.#defaultRounds.forEach((round) => {
				const newRound = new GameRound(round);
				if (newRound.index > -1) this.#rounds[newRound.index] = newRound;
			});
			// TODO: validate round indices to ensure contiguous numbers

		}
	}

	get list() { return Array.from(this.#rounds) }

	get current() { return this.#currentRound }

	async next() {
		await this.#currentRound.endRound();
		this.#currentRound = this.#rounds[(this.#currentRound.index + 1) % this.#rounds.length];
		await this.#currentRound.startRound();
		return 1;
	}

}