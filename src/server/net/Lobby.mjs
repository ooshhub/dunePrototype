export class Lobby {

	#maxPlayers = 1;
	#ruleset = null;
	#rulesetOptions = {};


	constructor(name, host) {
		this.name = name;
		this.host = host;
	}

	#setMaxPlayers(newMax) {
		const allowedValues = Array(8).fill().map((_,i) => i+1);
		if (allowedValues.includes(newMax)) {
			this.#maxPlayers = newMax;
			console.log(`Lobby player limit set: ${this.#maxPlayers}`);
			return newMax;
		} else return 0;
	}

	setRuleset(ruleset) {
		if (this.#ruleset) return console.warn('Ruleset already selected.');
		let playerLimitSet = this.#setMaxPlayers(ruleset.maxPlayers);
		if (playerLimitSet) {
			console.log('setting ruleset');
			this.#ruleset = ruleset;
			return 1;
		} else {
			console.error('Illegal player limit passed to Lobby.');
			return 0;
		}
	}

	updateOptions(options) {
		console.log(`Updating Lobby ruleset options`);
		Object.assign(this.#rulesetOptions, options);
	}
	
}