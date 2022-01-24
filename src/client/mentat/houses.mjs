export const defaultHouses = {

	atreides: {
		basic: {
			name: 'Atreides',
			title: 'House Atreides',
			leader: `Paul Muad'Dib`,
			stats: {
				// TODO: combine with ruleset data so there's only one place to update House rules. Make part of House class, one method to return Mentat data????
				soldiers: 20,
				startingPosition: {
					placed: [
						{ arrakeen: 10 }
					],
					reserve: 10,
					movement: 3
				},
				startingSpice: 10,
				freeRevival: 2,
			},
			abilities: [
				`During the bidding round, you may look at each %%Treachery card|treacheryCards%% as it comes up for purchase before any player bids on it.`,
				`At the start of the movement round, you may look at the top card of the %%Spice deck|spiceDeck%%.`,
				`During the battle round, you may force your opponent to show you your choice of *one* of the four elements they will use in their battle plan against you: the %%Leader%%, the %%weapon%%, the %%defence%% or the %%number dialed|battleWheel%%. If your opponent shows you that they are not playing a weapon or defence, you may not ask to see another element of the plan.`
			],
			alliance: [`You may assist your allies by forcing their opponents to show them one element of their battle plan.`],
			art: {
				avatar: `art/mentat/rulers/atreides`,
				background: `art/mentat/backgrounds/arrakis1`,
			},
			description: `The good guys.`,
			lore: [
				`Thufir fucks children.`
			],
			tooltipFields: ['abilities', 'alliance']
		}
	},

	harkonnen: {
		basic: {
			name: 'Harkonnen',
			title: 'House Harkonnen',
			leader: `Baron Vladimir Harkonnen`,
			stats: {
				soldiers: 20,
				startingPosition: {
					placed: [
						{ carthag: 10 }
					],
					reserve: 10,
					movement: 3
				},
				startingSpice: 10,
				freeRevival: 2,
			},
			abilities: [
				`At the start of the game you write down the name of *all* the leaders belonging to other players which you draw. All are %%in your pay|traitors%%.`,
				`You may hold up to 8 %%Treachery cards|treacheryCards%%. At first, you are dealt 2 cards instead of 1, and every time you buy a card you get an extra card free from the deck (if you have less than 8 cards).`
			],
			alliance: [`%%Leaders%% in your pay may betray your allies' opponents, too.`],
			art: {
				avatar: `art/mentat/rulers/atreides`,
				background: `art/mentat/backgrounds/arrakis1`,
			},
			description: `The bad guys.`,
			lore: [
				`Piter fucks children.`
			],
			tooltipFields: ['abilities', 'alliance']
		}
	},

}