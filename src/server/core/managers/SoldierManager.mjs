import { SoldierService } from "../services/SoldierService.mjs";

export class SoldierManager {

  #service = null;

  constructor(managerData = {}) {
    this.#service = new SoldierService();
    this.name = managerData.name ?? `SoldierManager`;
  }
  
}