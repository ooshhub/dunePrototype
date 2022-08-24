/**
 * Backend Soldier class - there are <maxSoldiers> of these generated per House at game creation
 * Soldiers are revived in the Tleilaxu tanks, and don't need to be generated after game creation
 * 
 */

import { NameGenerator } from '../utilities/soldierNameGenerator.mjs';
import { slog } from '../../serverHub.mjs';
import { Helpers } from '../../../shared/Helpers.mjs';

export class Soldier {

  #logger = null;

  #alive = true;
  #deathCount = 0;

  constructor({ houseName, hid, assignSoldierName }) {
    this.#logger = slog;
    if (!houseName || !hid) {
      this.#logger(`${this.constructor.name}: Error creating soldier, house not found`);
      return {};
    }
    Object.assign(this, {
      id: Helpers.generateUID(),
      hid: hid,
      house: houseName,
      name: assignSoldierName ?? NameGenerator.generate(houseName)
    });
  }

  get isAlive() { return this.#alive }
  get deathCount() { return this.#deathCount }

  kill() {
    this.#deathCount ++;
    this.#alive = 0
  }

  revive() { this.#alive = 1 }

}