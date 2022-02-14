import { CardDeck } from "./rulesets/decks/CardDeck.mjs";

export class CardDeckController {

	#decks = {};

	constructor(decks) {
		this.name = 'Card Deck Controller';
		for (let deck in decks) {
			const newDeck = new CardDeck(decks[deck]);
			this.#decks[newDeck.id] = newDeck;
		}
	}

	get list() {
		const output = {name: this.name, decks: {} };
		for (let d in this.#decks) { output.decks[d] = this.#decks[d].list }
		return output;
	}

}