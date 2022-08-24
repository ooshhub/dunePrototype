// TODO: Create baseModel to extend from

export class House {

  // TODO: validation methods for type checking

  // Define properties and type check
  #modelProperties = {
    hid: {
      type: 'string:hid',
      required: true,
    },
    lastPlayer: {
      type: 'string:pid',
      required: true,
    },
    houseDot: {
      type: 'float',
      required: true,
    },
    rulesetName: {
      type: 'string',
      required: true,
    }
  }

  constructor(houseData) {
    for (const key in this.#modelProperties) {
      // Do type checking with static Model methods
      // Do required checking with static Model methods
      // Do checking of invalid keys via static Model method
      this[key] = houseData[key];
    }
  }
  
}