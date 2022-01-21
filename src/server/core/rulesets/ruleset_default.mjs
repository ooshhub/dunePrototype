// core game rulesets & options
import { Ruleset } from './Ruleset.mjs';

export const ruleset = async () => {
	const newRuleset = new Ruleset({
		name: 'Default Dune Rules',
		availableHouses: ['atreides', 'harkonnen'],
		serverOptions: [
			{
				name: `Duplicate Houses`,
				id: 'duplicateHouses',
				type: 'switch',
				default: 0
			},
			{
				name: `Custom colors`,
				id: 'customColor',
				type: 'switch',
				default: 1
			}			
		]
	});
	await newRuleset.populateHouses();
	return newRuleset;
}