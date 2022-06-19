import * as Pixi from '../lib/pixi.mjs';
import { helpers } from '../../../shared/helpers.mjs';

export class Army extends Pixi.Sprite {

  #soldiers = [];

  constructor(armyData = {}) {
    // TODO: default properties required by Sprite classs
    super(armyData);
    Object.assign(this, {
      id: helpers.generateUID(),
      name: armyData.name || 'newArmy',
      house: armyData.house || null,
      hid: armyData.hid || null,
      strength: 0,
    });
    
  }
}