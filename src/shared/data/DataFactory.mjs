import DataArrayDriver from "./DataArrayDriver.mjs";

export default class DataFactory {
  static make(driver = "array") {
    switch(driver) {
      case "array":
        return new DataArrayDriver();
      default:
        throw new Error(`Driver '${driver}' not implemented.`);
    }
  }
}