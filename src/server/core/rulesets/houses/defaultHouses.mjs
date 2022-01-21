// default House definitions
import { House } from './House.mjs';

const atreides = new House({
	name: 'Atreides',
	leader: {
		name: 'Paul Atreides',
		avatar: 'leader_paulAtreides.png'
	},
	defaultColor: '#2222dd',
	abilities: [`jessica's titties`],
});

const harkonnen = new House({
	name: 'Harkonnen',
	leader: {
		name: 'Baron Vladimir Harkonnen',
		avatar: 'leader_baronHarkonnen.png'
	},
	defaultColor: '#dd2222',
	abilities: [`vlad's titties`],
});

export { atreides, harkonnen }