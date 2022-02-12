import { CardDeck } from "./rulesets/decks/CardDeck.mjs";

export class CardDeckController {

	#decks;

	constructor(decks) {
		for (let deck in decks) {
			const newDeck = new CardDeck(decks[deck]);
			this.#decks[newDeck.id] = newDeck;
		}
	}

	get list() { return this.#decks }

}