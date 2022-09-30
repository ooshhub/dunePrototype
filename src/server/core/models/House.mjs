import { Model } from "./Model.mjs";

export class House extends Model {

  // Define properties and type check
  static #modelProperties = {
    hid: {
      type: 'string:uid',
      required: true,
    },
    lastPlayer: {
      type: 'string:uid',
      required: true,
    },
    houseDot: {
      type: 'number',
      required: true,
    },
    rulesetName: {
      type: 'string',
      required: true,
    }
  }

  constructor(houseData = {}) {
    super(houseData.hid, houseData, House.#modelProperties);
    if (!this.id) throw new Error(`${this.constructor.name}: Failed to create model`);
  }
  
}