// stuff

export class FrameController {

  #name = null;
  #container = null;

  #frameTypes = ['standard', 'info', 'error'];

  #activeFrames = {};

  #config = {
    maxPopups: {
      standard: 1,
      info: 1,
      error: 1,
    },

  }

  constructor(controllerData) {

  }

  get name() { return this.#name }

}