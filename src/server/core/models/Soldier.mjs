/**
 * Backend Soldier class - there are <maxSoldiers> of these generated per House at game creation
 * Soldiers are revived in the Tleilaxu tanks, and don't need to be generated after game creation
 * 
 */
// import { NameGenerator } from '../utilities/soldierNameGenerator.mjs';
import { Model } from './Model.mjs';

export class Soldier extends Model {

  // Define properties and type check
  static #modelProperties = {
    id: {
      type: 'string:uid',
      required: true,
      auto: true,
    },
    name: {
      type: 'string',
      required: true
    },
    hid: {
      type: 'string:uid',
      required: true
    },
    houseName: {
      type: 'string',
      required: true
    },
    isAlive: {
      type: 'boolean',
      required: true,
      default: true
    },
    deathCount: {
      type: 'integer',
      required: true,
      default: 0,
    },
    isElite: {
      type: 'boolean',
      required: true,
      default: false,
    },
    rank: {
      type: 'integer',
      required: true,
      default: 0
    },
    history: {
      type: 'array',
      required: true,
      default: [],
    }
  }

  constructor(soldierData = {}) {
    super(Model.generateUID(), soldierData, Soldier.#modelProperties);
    if (!this.id) return new Error(`${this.constructor.name}: Failed to create model`);
  }

  // Pass to Model update method
  update(updateData = {}) {
    const result = super.update(updateData, Soldier.#modelProperties);
    if (!result) this.logger?.(`${this.constructor.name}: update failed.`, 'warn');
  }

}