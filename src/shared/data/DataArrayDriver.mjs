import DataContract from "./DataContract.mjs";

export default class DataArrayDriver extends DataContract {
  #store = {}

  save(key, value) {
    this.#store[key]  = value;
  }

  get(key) {
    return this.#store[key];
  }
}