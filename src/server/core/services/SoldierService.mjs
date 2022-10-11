import { slog } from "../../serverHub.mjs";
import { SoldierRepostiory } from "../repositories/SoldierRepository.mjs";
import { NameGenerator } from "../utilities/soldierNameGenerator.mjs";
import { BaseService } from "./BaseService.mjs";

export class SoldierService extends BaseService {

  #repository;

  constructor(serviceData = { name: 'SoldierService '}) {
    super(serviceData);
    this.#repository = new SoldierRepostiory();
  }

  all() { return this.#repository.all() }

  async initAllHouseSoldiers(houseList = {}) {
    for (const house in houseList) {
      const houseName = houseList[house].rulesetName,
        soldierTotal = houseList[house].stats.soldiers ?? 20,
        eliteTotal = houseList[house].stats.elites ?? 0;
      if (houseName) {
        await this.generateHouseForces({
          houseName,
          hid: house,
          soldierTotal,
          eliteTotal
        });
      }
    }
    return this.all();
  }

  async generateHouseForces({ houseName, hid, soldierTotal, eliteTotal }) {
    // Generate 20 soldiers for a house
    this.logger({ houseName, hid, soldierTotal, eliteTotal });
    const soldierNames = Array(soldierTotal).fill().map(() => NameGenerator.generate(houseName));
    this.logger(soldierNames.length);
    soldierNames.forEach((soldierName, i) => {
      this.logger(i);
      this.#repository.create({
        name: soldierName,
        hid: hid,
        houseName: houseName,
        isElite: i < eliteTotal,
      });
    });
    this.logger(this.all());
  }

  addLifeEvent() {}

  killSoldier() {}


}