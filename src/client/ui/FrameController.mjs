export class FrameController {

  #containers = {}; // Collection of elements the controller can throw popups in

  #popupTemplates = {};

  #activePopups = [];
  #visibleFrames = [];
  #hiddenFrames = [];

  #config = {
    debug: 0,
    maxPopups: { default: 3, validate: (v) => parseInt(v) },
  }

  #classes = {
    prefix: `fc-`,
    show: 'fadein-',
    hide: `fadeout-`,
    fadeSpeeds: ['normal', 'slow', 'fast', 'snap'], // index 0 is default speed
    popup: `popup-`,
    info: `info`,
    error: `error`,
    query: `query`,
  };

  #templates = {
    info: ``,
    error: ``,
    query: ``,
  }

  #rx = { }

  #logger = console.log;

  // containers = {} collection of {name: HTMLElement|Selector} pairs, elements the controller can throw popups in

  constructor(controllerData = {}) {
    this.name = controllerData.name;
    // Find container elements for popups
    for (const element in controllerData.containers) {
      const targetArray = this.#resolveSelectors(controllerData.containers[element], false);
      if (targetArray.length) this.#containers[element] = { target: targetArray[0], zIndexMax: 0 }
    }
    if (!Object.keys(this.#containers).length) console.warn(`${this.constructor.name} Warning: No Container elements were found, popups will be disabled.`);
    // Set config values if present, or use default
    const initConfig = typeof(controllerData.config ) === 'object' ? controllerData.config : {};
    for (const key in this.#config) this.#config[key].value = (initConfig[key] && this.#config[key].validate(initConfig[key])) ? initConfig[key] : this.#config[key].default;
    this.#logger = typeof(controllerData.logger) === 'function' ? controllerData.function : this.#logger;
    // Create regex for class name searches
    Object.assign(this.#rx, {
      show: new RegExp(`${this.#classes.prefix}${this.#classes.show}\\w+`, 'g'),
      hide: new RegExp(`${this.#classes.prefix}${this.#classes.hide}\\w+`, 'g'),
    });
  }

  get logger() { return this.#config.debug ? this.#logger : () => {} }

  // Inserts new stylesheet
  #insertNewStyleSheet(filePath) {
    const newSheet = document.createElement('link');
    newSheet.rel = 'stylesheet';
    newSheet.href = filePath;
    document.querySelector('head').append(newSheet);
  }

  // Fade elements in and out
  async #fadeElements(elements, direction, speed, selectAll = true) {
    speed = this.#config.fadeSpeeds.includes(speed) ? speed : this.#config.fadeSpeeds[0] ?? '';
    direction = direction === 'show' ? 'show' : 'hide';
    const reverseDirection = direction === 'show' ? 'hide' : 'show';
    const targets = this.#resolveSelectors(elements, selectAll);
    if (targets) {
      Promise.all(targets.map(el => {
        el.class.value = el.class.value.replace(this.#rx[reverseDirection]).trim(); // remove opposing classes
        el.class.value += ` ${this.#classes.prefix}${this.#classes[direction]}${speed}`;
      }));
    }
  }
  showElements(elements, speed, selectAll) { this.#fadeElements(elements, 'show', speed, selectAll) }
  hideElements(elements, speed, selectAll) { this.#fadeElements(elements, 'hide', speed, selectAll) }

  // Create a popup and attach to #container
  // Returns a Promise, can be awaited to halt process until a response is received.
  async #createPopup(popupData = {}) {
    if (!popupData.container || !this.#containers[popupData.container]) return console.error(`${this.constructor.name} Error: No target or bad target for popup`, popupData);
    const newPopup = document.createElement('div');
    if (this.popupData.template) newPopup.innerHTML = this.popupData.template;
    else {
      
      newPopup.class.value = `${this.#classes.prefix}${this.#classes.popup}`;
      
    }
  }

  #destroyPopup() {}

  #resolveSelectors(elementSelectors, selectAll) {
    elementSelectors = Array.isArray(elementSelectors) ? elementSelectors : [elementSelectors];
    return elementSelectors.reduce((collection, element) => {
      if (typeof(element) === 'object' && element?.tagName) collection.push(element);
      else if (typeof(element) === 'string') {
        let output = (selectAll) ? Array.from(document.querySelectorAll(element)) : [document.querySelector(element)].filter(v=>v);
        if (output && output.length !== 0) collection.push(...output)
        else this.logger(`${this.constructor.name} Error: selector "${element}" returned no results.`);
      }
      return collection;
    }, []);
  }

  // Supply key & value as params, or just a single object with kv pairs
  config(settings, value) {
    if (!settings) return this.#config;
    const changes = [];
    const setNewValue = (key, value) => {
      if (!this.#config[key]) this.logger(`${this.constructor.name}: "${settings}" key not found.`);
      else if (this.#config[key].validate(value)) {
        this.#config[key] = value;
        changes.push(`${key} = ${value}`);
      }
      else this.logger(`${this.constructor.name}: Did not set config key ${key} - new value "${value}" failed validation.`);
    }
    if (typeof settings === 'object') { for (const key in settings) { setNewValue(key, settings[key]) } }
    else if (typeof settings === 'string') {
      if (!value) return this.#config[settings];
      else setNewValue(settings, value);
    }
    if (changes.length) this.#logger(`${this.name} config updated:\n${changes.join('\n')}`);
  }

  popup() {  }

}