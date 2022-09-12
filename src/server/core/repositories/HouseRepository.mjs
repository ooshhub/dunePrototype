/**
 * CRUD operations for backend Houses
 * Create Houses on game creation
 * 
 */

import { House } from "../models/House.mjs";
import { BaseRepository } from "./BaseRepository.mjs";

export class HouseRepository extends BaseRepository {

  #store = [];

  constructor() { super() }

  all() { return this.#store }

  create(houseData) {
    const newHouse = new House(houseData);
    if (newHouse.hid && !this.#store[newHouse.hid]) this.#store[newHouse.hid] = newHouse;
  }

  read(houseId) {
    const house = new House();
    house.id = houseId;

    return house.get();
    return this.#store[houseId] ?? null;
  }

  update() {}

  delete() {
    console.error(`${this.constructor.name}: Houses cannot be remove from a game.`);
    return null;
  }

}