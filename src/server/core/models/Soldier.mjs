import { soldierNames } from './soldierNames.mjs';
import { slog } from '../../serverHub.mjs';

export class Soldier {

  #logger = null;

  constructor(house) {
    this.#logger = slog;
    if (!house || !soldierNames[house]) {
      this.#logger(`${this.constructor.name}: Error creating soldier, house not found`);
      return {};
    }
    Object.assign(this, {
      
    })
  } 
}