import { slog } from "../../serverHub.mjs";
import { JsonDataStore } from "./drivers/JsonDataStore.mjs";

export class DataStoreFactory {
  /**
   * Get the DataStore class
   * @param {string} driver 
   * @returns 
   */
  static create(storeOptions, driver = 'json') {
    switch(driver) {
      case 'json':{
        return new JsonDataStore(storeOptions);
      }
    }
  }
}