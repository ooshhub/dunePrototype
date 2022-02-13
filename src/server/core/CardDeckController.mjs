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

	get list() { return { name: this.name, decks: this.#decks } }

}