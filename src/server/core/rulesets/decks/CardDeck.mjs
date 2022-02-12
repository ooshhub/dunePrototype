import { slog } from "../../../serverHub.mjs";

export class CardDeck {

	#deck = {
		all: [],
		available: [],
		discarded: [],
		loaned: [],
	};

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
					this.#deck.all.push({
						id: `${card.id}_${`${i}`.padStart(2, '0')}`,
						name: card.name,
						effects: card.effects
					});
				}
			});
		}
	}

	get count() {
		return {
			all: this.#deck.all.length,
			available: this.#deck.available.length,
			discarded: this.#deck.discarded.length,
			loaned: this.#deck.loaned.length
		}
	}

	shuffle(recallAll = false) {
		const cardsToShuffle = recallAll ? this.#deck.all : this.#deck.available.concat(this.#deck.discarded);
		this.#deck.available = [];
		for (let n=cardsToShuffle.length-1; n>=0; n--) {
			const cardIndex = Math.floor(Math.random()*n);
			const card = cardsToShuffle.splice(cardIndex, 1);
			slog(`Shuffling card ${cardIndex}`);
			this.#deck.available.push(card);
		}
		return 1;
	}

}