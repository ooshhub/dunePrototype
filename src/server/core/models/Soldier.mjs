import { soldierNames } from '../utilities/soldierNameGenerator.mjs';
import { slog } from '../../serverHub.mjs';
import { Helpers } from '../../../shared/Helpers.mjs';

export class Soldier {

  #logger = null;

  constructor(house) {
    this.#logger = slog;
    if (!house) {
      this.#logger(`${this.constructor.name}: Error creating soldier, house not found`);
      return {};
    }
    const nameGeneratorGroup = soldierNames[house] ?? soldierNames.default;
    Object.assign(this, {
      id: Helpers.generateUID(),
      name: soldierNames.gene
    })
  } 
}