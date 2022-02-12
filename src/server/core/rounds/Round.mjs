import { slog } from "../../serverHub.mjs";
import { helpers } from "../../../shared/helpers.mjs";

export class GameRound {

	#entryMethods = [];
	#exitMethods = [];

	constructor(roundData) {
		const data = (typeof(roundData) === 'string') ? defaultRounds[roundData] : roundData;
		if (!data) return null;
		Object.assign(this, {
			name: data.name,
			id: data.id
		});
		helpers.bindAll();
	}

	async startRound() {
		// Run through private entry methods
		// Will need to work out what to bind() them to...
		slog(`Running ${this.#entryMethods.length} entry methods for ${this.name}...`);
	}

	async endRound() {
		// Run through private exit methods
		// Will need to work out what to bind() them to...
		slog(`Running ${this.#exitMethods.length} entry methods for ${this.name}...`);
	}

}

const defaultRounds = {
	storm: {
		name: 'Storm Round',
		id: 'storm',
		index: 0,
		playerTurns: false,
	}
}