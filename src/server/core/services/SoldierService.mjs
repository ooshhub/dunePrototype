import { SoldierRepostiory } from "../repositories/SoldierRepository.mjs";

export class SoldierService {

  #repository = null;

  constructor(serviceOptions = {}) {
    this.#repository = new SoldierRepostiory();
    this.name = serviceOptions.name ?? `SoldierService`;
  }

  all() { return this.#repository.all() }

  generateSoldier() {}

  addLifeEvent() {}

  killSoldier() {}


}