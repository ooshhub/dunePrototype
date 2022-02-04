// default House definitions
import { House } from './House.mjs';

const atreides = new House({
	name: 'Atreides',
	title: 'House Atreides',
	ruler: {
		name: `Paul Muad'Dib`,
		avatar: `art/mentat/rulers/atreides`,
	},
	defaultColor: '#22dd22',
	stats: {
		// TODO: combine with ruleset data so there's only one place to update House rules. Make part of House class, one method to return Mentat data????
		soldiers: 20,
		startingPosition: {
			placed: {
				arrakeen: 10
			},
			reserve: 10,
			movement: 3
		},
		startingSpice: 10,
		freeRevival: 2,
	},
	abilities: [ // TODO: Move to HouseAbility class
		{
			name: 'Prescience',
			id: 'atreidesPrescience_treacheryPeak',
			tags: ['bidding'],
			description: `During the bidding round, you may look at each %%Treachery card|treacheryCards%% as it comes up for purchase before any player bids on it.`,
			effects: [], // TODO: build effects system to tell the game what the power does
		},
		{
			name: 'Prescience',
			id: 'atreidesPrescience_spicePeak',
			tags: ['movement'],
			description: `At the start of the movement round, you may look at the top card of the %%Spice deck|spiceDeck%%.`,
			effects: [],
		},
		{
			name: 'Prescience',
			id: 'atreidesPrescience_battlePeak',
			tags: ['battle'],
			description: `During the battle round, you may force your opponent to show you your choice of *one* of the four elements they will use in their battle plan against you: the %%Leader|leaders%%, the %%weapon|weapons%%, the %%defence|defences%% or the %%number dialed|battleWheel%%. If your opponent shows you that they are not playing a weapon or defence, you may not ask to see another element of the plan.`,
			effects: [],
		}
	],	// TODO: Move to HouseAlliance, subclass of HouseAbility
	alliance: [
		{
			name: 'Prescience',
			id: 'ally_atreidesPrescience_battlePeak',
			tags: ['battle'],
			description: `You may assist your allies by forcing their opponents to show them one element of their battle plan.`,
			effects: [],
		},
	],
	advanced: { //TODO: advanced rule options go here
		abilities: [],
	},
	mentat: {// TODO: move into MentatEntry class / House subclass ???
		art: {
			portrait: `art/mentat/rulers/atreides`,
			background: `art/mentat/backgrounds/arrakis1`,
		},
		description: `The good guys.`,
		lore: [
			`Thufir fucks children.`
		],
		tooltipFields: ['abilities', 'alliance'],
	}
});

const harkonnen = new House({
	name: 'Harkonnen',
	title: 'House Harkonnen',
	defaultColor: `#000000`,
	ruler: {
		name: `Baron Vladimir Harkonnen`,
		avatar: `art/mentat/rulers/harkonnen`,
	},
	stats: {
		// TODO: combine with ruleset data so there's only one place to update House rules. Make part of House class, one method to return Mentat data????
		soldiers: 20,
		eliteSoldiers: 0,
		startingPosition: {
			placed: {
				carthag: 10
			},
			reserve: 10,
			movement: 3
		},
		startingSpice: 10,
		freeRevival: 2,
	},
	abilities: [ // TODO: Move to HouseAbility class
		{
			name: 'Treacherous',
			id: 'harkonnenTreacherous_extraTratiors',
			tags: ['setup'],
			description: `At the start of the game you write down the name of *all* the leaders belonging to other players which you draw. All are %%in your pay|traitors%%.`,
			effects: []
		},
		{
			name: 'Treacherous',
			id: 'harkonnenTreacherous_treacheryCards',
			tags: ['bidding', 'setup'], //tags indicate which game systems the ability interacts with ???
			description: `You may hold up to 8 %%Treachery cards|treacheryCards%%. At first, you are dealt 2 cards instead of 1, and every time you buy a card you get an extra card free from the deck (if you have less than 8 cards).`,
			effects: [],
		},
	],	// TODO: Move to HouseAlliance, subclass of HouseAbility
	alliance: [
		{
			name: 'Treacherous',
			id: 'ally_harkonnenTreacherous_extraTraitors',
			tags: ['battle'],
			description: `%%Leaders|leaders%% in your pay may betray your allies' opponents, too.`,
			effects: [],
		},
	],
	advanced: { //TODO: advanced rule options go here
		abilities: [],
	},
	mentat: {// TODO: move into MentatEntry class / House subclass ???
		art: {
			portrait: `art/mentat/rulers/atreides`,
			background: `art/mentat/backgrounds/arrakis1`,
		},
		description: `The bad guys.`,
		lore: [
			`Piter fucks children.`
		],
		tooltipFields: ['abilities', 'alliance'],
	}
});

export { atreides, harkonnen }