import { slog } from "../../serverHub.mjs";
import { helpers } from "../../../shared/helpers.mjs";

export class GameRound {

	#entryMethods = [];
	#exitMethods = [];

	constructor(roundData) {
		const data = typeof(roundData) === 'string' ? defaultRounds[roundData] : roundData;
		if (!(data.index > -1)) return null;
		Object.assign(this, {
			name: data.name,
			id: data.id,
			index: data.index,
		});
		helpers.bindAll(this);
	}

	async startRound() {
		// Run through private entry methods
		// Will need to work out what to bind() them to...
		slog(`Running ${this.#entryMethods.length} entry methods for ${this.name}...`);
	}

	async endRound() {
		// Run through private exit methods
		// Will need to work out what to bind() them to...
		slog(`Running ${this.#exitMethods.length} exit methods for ${this.name}...`);
	}

}

const defaultRounds = {
	storm: {
		name: 'Storm Round',
		id: 'storm',
		index: 0,
		playerTurns: false,
		entry: [],
		exit: [],
	},
	spiceBlow: {
		name: 'Spice Blow Round',
		id: 'spiceBlow',
		index: 1,
		playerTurns: false,
	},
	bidding: {
		name: 'Bidding Round',
		id: 'bidding',
		index: 2,
		playerTurns: true,
	},
	movement: {
		name: 'Movement and Revival Round',
		id: 'movement',
		index: 3,
		playerTurns: true,
	},
	battle: {
		name: 'Battle Round',
		id: 'battle',
		index: 4,
		playerTurns: true,
	},
	collection: {
		name: 'Spice Collection Round',
		id: 'collection',
		index: 5,
		playerTurns: false,
	}
}