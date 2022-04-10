// import { helpers } from '../shared/helpers.mjs';

export class DuneStore {

	#houses = {};
	#players = {};
	#session = null;

	constructor(additionalData) {
		Object.assign(this, additionalData);
	}

	layers = {};
	client = null;
	CONFIG = null;
	activePlayer = {};
	RenHub = null;

	set Houses(val) { console.warn() }

}