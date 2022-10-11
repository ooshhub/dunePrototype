import { Model } from "./Model.mjs";

export class House extends Model {

  // Define properties and type check
  static #modelProperties = {
    hid: {
      type: 'string:uid',
      required: true,
    },
    displayName: {
      type: 'string',
      required: true,
    },
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
    },
    ruler: {
      type: 'object',
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
    },
    stats: {
      type: 'object',
      required: true
    },
    abilities: {
      type: 'array',
      required: true
    },
    leaders: {
      type: 'array',
      required: true,
    },
  }

  constructor(houseData = {}) {
    super(houseData.hid, houseData, House.#modelProperties);
    if (!this.id) throw new Error(`${this.constructor.name}: Failed to create model`);
  }
  
}