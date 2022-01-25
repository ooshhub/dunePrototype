import { helpers } from '../shared/helpers.mjs';

export const fetchFilePath = (assetPath, custom = false) => {
	const assetsPrefix = window.Dune?.CONFIG?.PATH?.ASSETS;
	if (!assetPath || typeof assetPath !== 'string') return null;
	if (custom) {
		// Custom graphics loader
	} else {
		let filePath = helpers.getObjectPath(assetDirectory, assetPath, false);
		return `${assetsPrefix}/${filePath}`;
	}
}

// File path relative to src/assets/
const assetDirectory = {

	art: {
		tokens: {},
		cards: {},
		leaders: {
			atreides: ``
		},
		mentat: {
			rulers: {
				atreides: `mentat/rulerAtreides.png`,
				harkonnen: `mentat/rulerHarkonnen.png`
			},
			backgrounds: {
				arrakis1: `mentat/bgPlanetRise.jpg`
			}
		},
	},
	
	audio: {
		sounds: {},
		music: {},
	},

}