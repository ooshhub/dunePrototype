export class Ruleset {

	constructor(ruleData) {
		let newData = {
			name: ruleData.name || 'New Ruleset',
			custom: ruleData.custom || false, // must be set to true to use non-core data
			availableHouses: ruleData.availableHouses || ['atreides', 'harkonnen', 'guild', 'beneGesserit', 'emperor', 'fremen'],
			players: ruleData.players || [2,3,4,5,6,7,8],
			map: ruleData.map || 'duneDefault',
			storm: {
				direction: ruleData?.storm?.direction || 'antiClockwise',
				range: ruleData?.storm?.range || '2d6'
			},
			Houses: {},
			decks: {},
			serverOptions: ruleData.serverOptions ?? [],
		}
		Object.assign(this, newData);
	}

	async populateHouses() {
		if (this.custom) {
			// Deal with custom loading
		} else {
			const DefaultHouses = await import('./houses/defaultHouses.mjs');
			this.availableHouses.forEach(house => {
				if (DefaultHouses[house]) this.Houses[house] = DefaultHouses[house];
			});
		}
	}

	async populateDecks() {
		if (this.custom) {
			// Deal with custom loading
		} else {
			const { defaultDecks } = await import('./decks/defaultDecks.mjs');
			for (let deck in defaultDecks) {
				this.decks[deck] = defaultDecks[deck];
			}
		}
	}
}