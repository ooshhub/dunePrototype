import DataFactory from "../../../shared/data/DataFactory.mjs";

export class Model {
  #dataService = null;

  constructor() {}
  
  get dataService() {
    if(this.#dataService !== null)
      return this.#dataService;

      // TODO: Pass driver from global configuration to make function.
    return this.#dataService = DataFactory.make();
  }

  getProperties() {
    // Provide more data
    throw new Error("Unimplemented.");
  }

  serialize() {}
  unserialize(data) {}

  _getKey() {
    return this.id;
  }

  get() {
    return this.unserialize(this.dataService.get(`${this.constructor.name}-${this._getKey()}`));
  }

  save() {
    this.dataService.save(`${this.constructor.name}-${this._getKey()}`, this.serialize());
  }
}


/**
 * 
 * Core => Manager => Service => Repository => Model
 *                 => Transformer
 * 
 */