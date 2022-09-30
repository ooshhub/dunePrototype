import { BaseRepository } from "./BaseRepository.mjs";
import { Soldier } from "../models/Soldier.mjs";

export class SoldierRepostiory extends BaseRepository {

  #dataStore;

  constructor(soldierRepositoryData = {}) {
    super(soldierRepositoryData);
    this.#dataStore = BaseRepository.createDataStore(soldierRepositoryData);
    this.name = soldierRepositoryData.name ?? `SoldierRepository`;
  }

  get store() { return this.#dataStore; }

  all() { return Object.values(this.#dataStore); }

  create(soldierData = {}) {
    const newSoldier = new Soldier(soldierData);
    return newSoldier ? this.#dataStore.create(newSoldier) : null;
  }

  get(soldierId) { return soldierId ? this.#dataStore.read(soldierId) : null; }

  // Send update() through the Model
  update(updateData = {}) {
    const soldier = this.#dataStore.read(updateData.id);
    if (!soldier) {
      this.logger?.(`${this.constructor.name}: Update failed, no soldier found with ID "${updateData.id}"`, 'warn');
      return null;
    }
    soldier.update(updateData);
  }

  destroy(soldierId) {
    const result = this.#dataStore.destroy(soldierId);
    if (!result) this.logger?.(`${this.constructor.name}: Destroy failed on soldier with ID "${soldierId}"`, 'warn');
  }

}