export class DataStoreInterface {

  constructor(dataStoreOptions = {}) {
    this.name = dataStoreOptions.name ?? 'newDataStore'
  }

  create() { throw new Error(`${this.constructor.name}: interface method not implemented.`) }
  read() { throw new Error(`${this.constructor.name}: interface method not implemented.`) }
  update() { throw new Error(`${this.constructor.name}: interface method not implemented.`) }
  overwrite() { throw new Error(`${this.constructor.name}: interface method not implemented.`) }
  destroy() { throw new Error(`${this.constructor.name}: interface method not implemented.`) }

}