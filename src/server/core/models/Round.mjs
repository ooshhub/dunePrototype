import { slog } from "../../serverHub.mjs";
import { Helpers } from "../../../shared/Helpers.mjs";

export class GameRound {

	#entryTasks = [];
	#exitTasks = [];

	constructor(roundData) {
		const data = typeof(roundData) === 'string' ? defaultRounds[roundData] : roundData;
		// slog(data, 'warn');
		if (!(data.index > -1)) return null;
		Object.assign(this, {
			name: data.name,
			id: data.id,
			index: data.index,
		});
		this.#entryTasks = (Helpers.toArray(data.entry))?.sort((a,b) => a.order - b.order) ?? [];
		this.#exitTasks = Helpers.toArray(data.exit)?.sort((a,b) => a.order - b.order) ?? [];
		Helpers.bindAll(this);
	}

	// get entryTasks() { return this.#entryTasks }
	// get exitTasks()

	startRound() {
		// Run through private entry methods
		// Will need to work out what to bind() them to...
		slog(`Running ${this.#entryTasks.length} entry methods for ${this.name}...`);
		return this.#entryTasks;
	}

	endRound() {
		// Run through private exit methods
		// Will need to work out what to bind() them to...
		slog(`Running ${this.#exitTasks.length} exit methods for ${this.name}...`);
		return this.#exitTasks;
	}

}

const defaultRounds = {
	storm: {
		name: 'Storm Round',
		id: 'storm',
		index: 0,
		playerTurns: false,
		entry: [
			{
				name: `cardOpportunity`,
				description: `Card Opportunity - storm movement`,
				order: 10,
				actionId: `core/awaitCardOpportunity`,
				actionTags: `stormMovement` 
			},
			{
				name: `stormMovement`,
				description: `Roll Storm movement`,
				order: 20,
				actionId: `core/rollStormMovement`,
			},
			{
				name: `determineTurnOrder`,
				description: `Create House turn order`,
				order: 30,
				actionId: `core/determineTurnOrder`
			},
		],
		exit: [
			{
				name: `playersReady`,
				description: `Pause for all players ready with auto-timeout`,
				order: 10,
				actionId: `core/timeout`,
				actionTags: 'standard'
			}
		],
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