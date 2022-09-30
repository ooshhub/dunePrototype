/**
 * Base repository for CRUD operations on backend classes
 */
import { DataStoreFactory } from "../dataStore/DataStoreFactory.mjs";
import { slog } from "../../serverHub.mjs";

 export class BaseRepository {
 
  constructor(repositoryData ={}) {
    this.name = repositoryData.name;
    this.logger = slog;
  }

  static createDataStore(storeData = {}) { return DataStoreFactory.create(storeData); }
 
  /**
   * Fetch all Models in a store
   * @returns {Array.<Model>} 
   */
  all() { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }
 
  /**
   * Create a new Model from supplied data
   * @param {object} modelData
   * @returns {?Model}
   */
  create(modelData) { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }// eslint-disable-line no-unused-vars

  /**
   * Return a Model from a store
   * @param {string} modelId
   * @returns {?Model}
   */
  get(modelId) { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }// eslint-disable-line no-unused-vars
 
  /**
   * Update a Model - should be done via the Model superclass update() method
   * @param {object} modelData - include UID in object data
   * @returns {?Model}
   */
  update(modelData) { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }// eslint-disable-line no-unused-vars
 
  /**
   * Destroy a Model
   * @param {string} modelId
   * @returns {?string} - return id on success, null on failure
   */
  destroy(modelId) { throw new Error(`${this.constructor.name}: Subclass failed to implement this method. `) }// eslint-disable-line no-unused-vars
 
 }