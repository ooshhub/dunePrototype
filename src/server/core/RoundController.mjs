// Round controller
import { GameRound } from "./rounds/Round.mjs";

export class RoundController {

	#defaultRounds = ['storm', 'spiceBlow', 'bidding', 'movement', 'battle', 'collection'];

	#rounds = [];

	#currentRound = {};
	
	constructor(ruleset) {
		this.name = ruleset.name || 'defaultRounds';
		if (ruleset.custom) {
			// Custom ruleset constructor
		} else {
			this.#defaultRounds.forEach((round, i) => {
				this.#rounds.push(new GameRound(round, i));
			});
		}
	}

	get list() { return this.#rounds }

	get current() { return this.#currentRound }

	async next() {
		await this.#currentRound.endRound();
		this.#currentRound = this.#rounds[(this.#currentRound.index + 1) % this.#rounds.length];
		await this.#currentRound.startRound();
		return 1;
	}

}