import { SoldierService } from "../services/SoldierService.mjs";
import { BaseManager } from "./BaseManager.mjs";

export class SoldierManager extends BaseManager {

  #service;

  constructor(managerData = { name: 'SoldierManager' }) {
    super(managerData);
    this.#service = new SoldierService();
  }

  async initialiseGame(houseList = {}) {
    this.logger(['initgame', houseList]);
    return await this.#service.initAllHouseSoldiers(houseList);
  }

  async updateAndRespond(newEvent) { 
    this.logger('updateAndRespond');
    return await super.updateAndRespondGeneric(newEvent, this).catch(err => err);
  }

  all() { return this.#service.all(); }

  get() {
    // 
  }


}