// import { helpers } from '../shared/helpers.mjs';

export class DuneStore {

	#Houses = {};
	#Players = {};
	#Layers = {};
	#Client = null;
	#CONFIG = null;
	#Session = null;
	#ActivePlayer = {};

  RenHub = null;

	constructor(additionalData) {
		Object.assign(this, additionalData);
	}

	get Houses() { return this.#Houses }
	set Houses(houseData) {
		if (typeof(houseData) === 'object') {
			// do things
		}
	}
}