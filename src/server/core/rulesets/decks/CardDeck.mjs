import { slog } from "../../../serverHub.mjs";

export class CardDeck {

	// Keep public for testing
	cards = {
		all: [],
		available: [],
		discarded: [],
		loaned: [],
	};

	#cardData = {};

	constructor(deckData, index=0) {
		Object.assign(this, {
			name: deckData.name || `New Deck ${index}`,
			description: deckData.description || '',
			schema: deckData.schema ?? 0.0,
			id: deckData.id || `newDeck_${index}`
		});
		if (deckData.cards?.length) {
			deckData.cards.forEach(card => {
				const quantity = card.quantity > 0 ? card.quantity : 1;
				for (let i=0; i<quantity; i++) {
					this.#cardData[card.id] = this.#cardData[card.id] ?? {
						effects: card.effects,
						name: card.name,
						// Whatever other card logic ends up being needed
					};
					this.cards.all.push({
						id: card.id, // 'id' is sent to client when they take a card, to match assets/help info etc.
						uid: `${card.id}_${`${i}`.padStart(2, '0')}`, // 'uid' is the card instance for server-side logical representation of deck
						data: this.#cardData[card.id], // Not really needed, but could leave a pointer here... there's only 50-odd cards in the game
					});
				}
			});
		}
	}

	get count() {
		return {
			all: this.deck.all.length,
			available: this.deck.available.length,
			discarded: this.deck.discarded.length,
			loaned: this.deck.loaned.length
		}
	}

	shuffle(recallAll = false) {
		const cardsToShuffle = recallAll ? this.deck.all : this.deck.available.concat(this.deck.discarded);
		this.deck.available = [];
		for (let n=cardsToShuffle.length-1; n>=0; n--) {
			const cardIndex = Math.floor(Math.random()*n);
			const card = cardsToShuffle.splice(cardIndex, 1);
			slog(`Shuffling card ${cardIndex}`);
			this.deck.available.push(card);
		}
		return 1;
	}

}