import { TemplateEngine } from './TemplateEngine.mjs';
import { FrameUtilities as utilities } from './FrameUtilities.mjs';
import { helpers } from '../../shared/helpers.mjs'; 

export class FrameController {

  #rootElement = {};
  #eventsElement = {};
  #containers = {}; // Collection of elements the controller can throw popups in
  #presets = {};

  #activeModals = []; // { id: -uid, type: 'loading', disable: false, blur: false }
  #visibleFrames = [];
  #hiddenFrames = [];

  #linkedHub = {};

  #disableFlag = null;
  #mainDisabled = false;
  #mainBlurred = false;

  #config = {
    debug: 0,
    maxModals: 10,
    draggable: true,
    hidden: false,
    dragHandle: 'header',
    disableMain: false,
    blurMain: true,
    eventElementId: 'fc-events',
    returnDataEvent: 'returnModalData',
  }

  #classes = {
    prefix: `fc-`,
    fade: {
      in: 'fadein-',
      out: `fadeout-`,
    },
    hidden: `hide`,
    fadeSpeeds: ['normal', 'slow', 'fast', 'snap'], // index 0 is default speed
    popup: `popup-`,
    info: `info`,
    error: `error`,
    query: `query`,
    disableMain: `disable`,
    blurMain: `blur`
  };

  #rx = { }

  // containers = {} collection of {name: HTMLElement|Selector} pairs, elements the controller can throw popups in

  constructor(controllerData = {}, templateConfig, eventHub) {
    this.name = controllerData.name;
    if (eventHub) this.#linkedHub = eventHub;
    // Set root element
    this.#rootElement = controllerData.rootElement ? utilities.resolveSelectors(controllerData.rootElement)[0] : window.document;
    if (!this.#rootElement) return console.error(`${this.constructor.name}: Error - bad root element: ${controllerData.rootElement}`);
    // Find container elements for popups
    for (const element in controllerData.containers) {
      const targetArray = utilities.resolveSelectors(controllerData.containers[element], false);
      if (targetArray.length) this.#containers[element] = { target: targetArray[0] }
    }
    if (!Object.keys(this.#containers).length) console.warn(`${this.constructor.name} Warning: No Container elements were found, modals will not function.`);
    // Set config values if present, or use default
    const initConfig = typeof(controllerData.config) === 'object' ? controllerData.config : {};
    for (const key in this.#config) this.#config[key].value = (initConfig[key] && this.#config[key].validate(initConfig[key])) ? initConfig[key] : this.#config[key].default;
    // Create regex for class name searches
    Object.assign(this.#rx, {
      show: new RegExp(`${this.#classes.prefix}${this.#classes.fade.in}\\w+`, 'g'),
      hide: new RegExp(`${this.#classes.prefix}${this.#classes.fade.out}\\w+`, 'g'),
    });
    // Load templates for popups
    this.templateEngine = new TemplateEngine(templateConfig.templates);
    this.#presets = templateConfig.presets;
    this.#setupEventElement();
  }

  get containers() { return Object.keys(this.#containers) }
  get presets() { return Object.keys(this.#presets) }

  get disableFlag() { return this.#disableFlag }
  set disableFlag(selector) {
    const flag = utilities.resolveSelectors(selector)?.[0];
    if (flag.tagName) this.#disableFlag = flag;
  }

  get activeModalCount() { return this.#activeModals.length??0 }

  get eventsElement() { return this.#eventsElement }

  templateEngine = {};

  #setupEventElement() {
    const newElement = this.#rootElement.createElement('div');
    newElement.style = 'display:none';
    newElement.class = '.hide';
    newElement.id = this.#config.eventElementId;
    this.#rootElement.append(newElement);
    this.#eventsElement = newElement;
  }

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
    direction = direction === 'in' ? 'in' : 'out';
    const reverseDirection = direction === 'in' ? 'out' : 'in';
    const targets = utilities.resolveSelectors(elements, selectAll);
    if (targets) {
      Promise.all(targets.map(el => {
        el.class.value = el.class.value.replace(this.#rx[reverseDirection], '').trim(); // remove opposing classes
        el.class.value += ` ${this.#classes.prefix}${this.#classes.fade[direction]}${speed}`;
      }));
    }
  }
  showElements(elements, speed, selectAll) { this.#fadeElements(elements, 'in', speed, selectAll) }
  hideElements(elements, speed, selectAll) { this.#fadeElements(elements, 'out', speed, selectAll) }

  #checkDisableAndBlur() {
    if (!this.disableFlag) return;
    const disable = this.#activeModals.reduce((count, modal) => count += modal.disable ? 1 : 0, 0),
      blur = this.#activeModals.reduce((count, modal) => count += modal.blur ? 1 : 0, 0);
    if (disable) {
      if (!this.#mainDisabled) this.#toggleMainWindow('disable', 'on');
      if (blur && !this.#mainBlurred) this.#toggleMainWindow('blur', 'on');
      else if (!blur && this.#mainBlurred) this.#toggleMainWindow('blur', 'off');
    }
    else {
      if (this.#mainDisabled) this.#toggleMainWindow('disable', 'off');
      if (this.#mainBlurred) this.#toggleMainWindow('blur', 'off');
    }
  }
  #toggleMainWindow(condition, state) {
    if (state==='on') {
      this.disableFlag.classList.add(this.#classes[`${condition}Main`]);
      (condition==='disable') ? this.#mainDisabled = true : this.#mainBlurred = true;
    }
    else if (state==='off') {
      this.disableFlag.classList.remove(this.#classes[`${condition}Main`]);
      (condition==='disable') ? this.#mainDisabled = false : this.#mainBlurred = false;
    }
  }

  #checkActiveModals() {
    this.#activeModals = this.#activeModals.reduce((index, modal) => {
      if (modal.container?.querySelector(`#${modal.id}`)) index.push(modal);
      return index;
    });
  }
  #addActiveModal(modalData) {
    if (!modalData.id) {
      console.warn(`${this.constructor.name}: Bad modal ID`);
      return false;
    }
    this.#checkActiveModals();
    if (this.activeModalCount < this.#config.maxModals) {
      this.#activeModals.push(modalData);
      this.#checkDisableAndBlur();
      return true;
    }
    else return false;
  }
  #removeActiveModal(modalId) {
    this.#activeModals = this.#activeModals.reduce((index, modal) => modal.id === modalId ? index : index.concat(modal), []);
  }

  #setInitialModalPosition = (modal, container) => {
    const modalSize = { x: modal.offsetWidth/2, y: modal.offsetHeight/2 },
      containerCenter = { x: container.offsetWidth/2, y: container.offsetHeight/2 },
      numberOfModals = container.querySelectorAll('.fc-dune')?.length ?? 0,
      offsetPixels = 10;
    const pos = { x: Math.round(containerCenter.x - modalSize.x + numberOfModals*offsetPixels), y: Math.round(containerCenter.y - modalSize.y + numberOfModals*offsetPixels) }
    modal.style.left = `${pos.x}px`;
    modal.style.top = `${pos.y}px`;
  }

  #insertModal(frameData = {}, container) {
    const targetContainer = container ? this.#containers[container] : Object.values(this.#containers)[0];
    if (!targetContainer) { return { err: `${this.constructor.name}: Error creating modal, bad container: ${container}` } }
    const frame = this.templateEngine.create(frameData);
    frame.id = helpers.generateUID();
    if (!frame?.tagName) { return { err: `${this.constructor.name}: Error creating modal: bad frame data: ${frameData}` } }
    const hidden = frameData.hidden ?? this.#config.hidden ?? false,
      draggable = frameData.draggable ?? this.#config.draggable ?? true,
      dragHandle = this.#config.dragHandle ? frame.querySelector(dragHandle) : null,
      disableMain = frameData.disableMain ?? this.#config.disableMain,
      blurMain = frameData.blurMain ?? this.#config.blurMain;
    // Check if capacity is reached, and add to index
    if (!this.#addActiveModal({ id: frame.id, type: frameData.type, container: targetContainer, disable: disableMain, blur: blurMain })) {
      console.warn(`${this.constructor.name}: Error creating modal - max capacity reached.`);
      return null;
    }
    // Append the frame
    frame.classList.add(this.#classes.hidden);
    targetContainer.append(frame);
    this.#setInitialModalPosition(frame);
    // TODO: Change to fade-in
    if (!hidden) {
      utilities.bringToFront(frame);
      frame.classList.remove(this.#classes.hidden);
    }
    if (draggable) utilities.dragElement(frame, dragHandle, { boundingElement: targetContainer });
    frame.addEventListener('mousedown', () => utilities.bringToFront(frame));
    return frame.id;
  }

  // Public interface for creating modals
  //
  // (await) createModal({
  // type: string - loading, error, alert, prompt,
  // awaitInput: boolean, if false only the frameid is returned
  // destroyOnEvent: string - eventname,
  // fireEvent: string - eventname,
  // eventTimeout: milliseconds, defaults to 20000. Set to 0 or less to disable
  // container: name of preset container in frame controller
  // disableMain: boolean - disable screen while modal is active (default false)
  // blurMain: boolean - blur screen while modal is active (default true, only active with disable=true)
  // hidden: boolean - whether to keep modal hidden after appending (default false)
  // draggable: boolean - default true
  // otherProps: all other TemplateEngine modal properties
  // })
  async createModal(modalData={}) {
    const container = this.containers.includes(modalData.container) ? modalData.container : null,
      modalType = this.presets.includes(modalData.type) ? modalData.type : 'custom',
      frameData = this.#presets[modalType] ?? {};
    Object.assign(frameData, modalData);
    const frameId = this.#insertModal(frameData, container);
    if (!frameId) return null;
    let returnData = frameId;
    // Handle loading frame, with self-destruct on finish loading event
    if (modalData.destroyOnEvent) this.#modalDestroyOnEvent(frameId, modalData.destroyOnEvent, modalData.eventTimeout);
    // Handle data return...
    // ...with await, for awaitInput flag (with OR without event propagating to eventHub)
    if (modalData.awaitInput) returnData = await this.#modalReturnHandler(frameId, modalData.fireEvent);
    // ...without await, for fireEvent ONLY, will return only the frame id
    else if (modalData.fireEvent) this.#modalReturnHandler(frameId, modalData.fireEvent);
    return returnData;
  }
  // Capture modal data return from TemplateEngine
  async #modalReturnHandler(frameId, fireEvent) {
    if (!this.#linkedHub.trigger) return console.error(`${this.constructor.name}: cannot use hub functions without a linked hub using 'trigger' function.`);
    const modalResponse = await new Promise(res => {
      const returnDataHandler = (ev) => {
        if (ev.detail.id === frameId) {
          res(ev.detail);
          this.eventsElement.removeEventListener(returnDataHandler);
        }
      }
      this.eventsElement.addEventListener(this.config('returnDataEvent'), returnDataHandler);
    });
    // Propagate event to eventHub
    if (fireEvent) this.#linkedHub.trigger(fireEvent, modalResponse);
    return modalResponse;
  }
  async #modalDestroyOnEvent(frameId, eventName, timer) {
    if (!this.#linkedHub.once) return console.error(`${this.constructor.name}: cannot use hub functions without a linked hub using 'once' function.`);
    const loadingEventHandler = () => this.destroyModal(`#${frameId}`);
    this.#linkedHub.once(eventName, loadingEventHandler);
    timer = parseInt(timer) ?? 20000;
    if (timer > 0) setTimeout(() => this.#linkedHub.trigger(eventName), timer);
  }

  // All methods of closing Modal must come through here
  destroyModal(frame) {
    frame = frame.tagName ? frame : utilities.resolveSelectors(frame);
    if (!frame.tagName) return console.warn(`${this.constructor.name}: Error destroying modal, bad reference "${frame}"`);
    this.#removeActiveModal(frame.id);
    // TODO: fade out
    frame.remove();
  }

  // Supply key & value as params, or just a single object with kv pairs
  // Supply key name only to get value
  config(settings, value) {
    if (!settings) return this.#config;
    const changes = [];
    const typeMatch = (key, newValue) => typeof(key) === typeof(newValue);
    const setNewValue = (key, value) => {
      if (!this.#config[key]) this.logger(`${this.constructor.name}: "${settings}" key not found.`);
      else if (typeMatch(this.#config[key], value)) {
        this.#config[key] = value;
        changes.push(`${key} = ${value}`);
      }
      else this.logger(`${this.constructor.name}: Did not set config key ${key} - new value "${value}" is wrong Type.`);
    }
    if (typeof settings === 'object') { for (const key in settings) { setNewValue(key, settings[key]) } }
    else if (typeof settings === 'string') {
      if (!value) return this.#config[settings];
      else setNewValue(settings, value);
    }
    if (changes.length) console.log(`${this.name} config updated:\n${changes.join('\n')}`);
  }

}