/**
 * Backend - an Army is any collection of Soldiers in a territory on the board
 */

import * as Pixi from '../lib/pixi.mjs';
import { Helpers } from '../../../shared/Helpers.mjs';

export class Army extends Pixi.Sprite {

  #soldiers = [];

  constructor(armyData = {}) {
    // TODO: default properties required by Sprite classs
    super(armyData);
    Object.assign(this, {
      id: Helpers.generateUID(),
      name: armyData.name || 'newArmy',
      house: armyData.house || null,
      hid: armyData.hid || null,
      strength: 0,
    });
    
  }
}