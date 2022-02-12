// core game rulesets & options
import { Ruleset } from './Ruleset.mjs';

export const ruleset = async () => {
	const newRuleset = new Ruleset({
		name: 'Basic Dune Rules',
		availableHouses: ['atreides', 'harkonnen'],
		serverOptions: {
			duplicateHouses: {
				name: `Duplicate Houses`,
				type: 'switch',
				default: 0
			},
			customColor: {
				name: `Custom colors`,
				type: 'switch',
				default: 1
			}			
		},
	});
	await newRuleset.populateHouses();
	await newRuleset.populateDecks();
	return newRuleset;	
}