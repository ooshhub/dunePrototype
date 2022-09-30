import { DataStoreInterface } from "../dataStoreInterface.mjs";

export class JsonDataStore extends DataStoreInterface {

  #store = {};

  constructor(storeData = {}) {
    super(storeData);
    this.driver = 'json';
  }

  get store() { return this.#store }

  /**
   * Check an ID is a valid object key name
   * @param {string} idString 
   * @returns {boolean}
   */
  #checkIdString(idString) { return (idString && !/\s/.test(`${idString}`)) }
  /**
   * Handle either id supplied as part of an object, or a string id
   * @param {string | object} keyOrObj
   * @returns {?object} { id: validId, data: validData }
   */
  #handleObjectOrIdString(idOrObject, optionalData) {
    if (!idOrObject) return null;
    const idString = typeof(idOrObject) === 'string' ? idOrObject
      : typeof(idOrObject) === 'object' ? idOrObject.id
      : null;
    const validId = this.#checkIdString(idString) ? idString : null;
    const validData = typeof(idOrObject) === 'object' ? idOrObject
      : optionalData && typeof(optionalData) === 'object' ? optionalData
      : null;
    if (!validId) console.error(`Bad ID supplied to DataStore: key "${idString}" was not written.`);
    if (!validData) console.error(`Bad data or no data supplied to DataStore: key "${idString}" was not written.`);
    return validId && validData ? { id: validId, data: validData }
      : null;
  }

  /**
   * Create a new entry
   * @param {string | object} idOrObject 
   * @param {*object} newData 
   * @return {?object} saved object or null
   */
  create(idOrObject, newData = {}) {
    const { id, data } = this.#handleObjectOrIdString(idOrObject, newData);
    if (!id) return null;
    if (this.#store[id]) {
      console.warn(`DataStore: create failed, "${id}" already exists!`);
      return null;
    }
    data.id = id;
    data.model = data.constructor?.name ?? 'Object';
    this.#store[id] = data;
    return this.#store[id];
  }

  /**
   * Get an entry by key
   * @param {string} id 
   * @returns {?object} fetched object or null
   */
  read(id) { return this.#store[id] ?? null }

  /**
   * Update an entry in the store
   * @param {string | object} idOrObject 
   * @param {*object} updateData 
   * @return {?object} saved object or null
   */
  update(idOrObject, updateData = {}) {
    const { id, data } = this.#handleObjectOrIdString(idOrObject, updateData);
    if (!id) return null;
    if (!this.#store[id]) {
      console.warn(`DataStore: update failed, could not find entry with id "${id}"`);
      return null;
    }
    data.id = id;
    Object.assign(this.#store[id], data);
    return this.#store[id];
  }

  /**
   * Overwrite an existing entry with all new data
   * @param {string | object} idOrObject 
   * @param {*object} overwriteData 
   * @return {?object} saved object or null
   */
  overwrite(idOrObject, overwriteData = {}) {
    const { id, data } = this.#handleObjectOrIdString(idOrObject, overwriteData);
    if (!id) return null;
    if (!this.#store[id]) {
      console.warn(`DataStore: overwrite failed, could not find entry with id "${id}"`);
      return null;
    }
    data.id = id;
    data.model = data.model ?? data.constructor?.name ?? 'Object';
    this.#store[id] = data;
    return this.#store[id];
  }

  /**
   * Delete an entry by key
   * @param {string} id 
   * @returns {?string} deleted id or null
   */
  destroy(id) {
    if (!this.#store[id]) {
      console.warn(`DataStore: destroy failed, could not find entry with id "${id}"`);
      return null;
    }
    delete this.#store[id];
    return id;
  }

  // TODO: these guys
  serialise() { }
  unserialise() { }

}