export class TemplateEngine {

  #templates = {};
  #defaultTemplate = null;

  #baseClass = '';

  #parentFrameControl = null;

  constructor(templateData, parentController) {
    this.#parentFrameControl = parentController?.constructor?.name === 'FrameController' ? parentController : null;
    if (!templateData || !Object.keys(templateData).length || !this.#parentFrameControl) return null;
    this.#baseClass = this.#parentFrameControl.modalBaseClass;
    for (const template in templateData) {
      if (['classes', 'properties'].includes(template)) continue;
      const t = templateData[template];
      this.#templates[template] = {};
      // Construct base template properties
      const newData = {
        html: typeof(t.html) === 'string' ? t.html : null,
        properties: this.#isObject(t.properties),
        buttons: this.#isObject(t.buttons),
        isDefault: t.default ?? false,
      };
      if (!newData.html) return console.warn(`${this.constructor.name}: template "${template}" did not contain valid html and was not registered.`);
      Object.assign(this.#templates[template], newData);
      // Check base template properties
      Object.assign(this.#templates[template].properties, {
        replacers: this.#isObject(this.#templates[template].properties.replacers),
        attributes: this.#isObject(this.#templates[template].properties.attributes),
        classes: this.#isObject(this.#templates[template].properties.classes),
        dataset: this.#isObject(this.#templates[template].properties.dataset),
      });
      // Check button properties
      Object.assign(t.buttons, {
        replacers: this.#isObject(this.#templates[template].buttons.replacers),
        attributes: this.#isObject(this.#templates[template].buttons.attributes),
        classes: this.#isObject(this.#templates[template].buttons.classes),
        dataset: this.#isObject(this.#templates[template].buttons.dataset),
      });
    }
    if (!this.templateNames.length) {
      console.error(`${this.constructor.name}: Aborted creation, no templates registered.`);
      return {};
    }
    this.#setDefaultTemplate();
  }

  get templateNames() { return Object.keys(this.#templates) }
  get default() { return this.#defaultTemplate }

  #isObject(prop) { return typeof(prop) === 'object' ? prop : {} }

  #getTagName(html) { return html.match(/^\s*<\s*(\w+)/)?.[1] ?? 'div' }

  #setDefaultTemplate() {
    if (this.#templates.default) this.#defaultTemplate = this.#templates.default;
    else {
      this.templateNames.forEach(t => {
        if (this.#templates[t].isDefault) this.#defaultTemplate = this.#templates[t];
      });
    }
    if (!this.#defaultTemplate) this.#defaultTemplate = this.#templates[this.templateNames[0]];
  }

  #validateProperty(prop, value) {
    let valid = true;
    if (Array.isArray(prop.type) && !prop.type.includes(typeof(value))) valid = false;
    if (typeof(prop.validate) === 'function' && !prop.validate(value)) valid = false;
    return valid;
  }

  #processReplacers(data, targetFrame, replacerConfig) {
    if (!Object.keys(replacerConfig).length) return;
    let newHTML = targetFrame.innerHTML;
    // console.info(newHTML);
    for (const replacer in replacerConfig) {
      const rx = new RegExp(`{%${replacer}%}`, 'gi');
      if (data[replacer] && this.#validateProperty(data[replacer])) {
        const replacerString = replacerConfig[replacer].transform ? replacerConfig[replacer].transform(data[replacer]) : data[replacer];
        newHTML = newHTML.replace(rx, replacerString);
      } else {
        const defaultString = replacerConfig[replacer].default ?? '';
        newHTML = newHTML.replace(rx, defaultString);
      }
    }
    // console.warn(newHTML);
    targetFrame.innerHTML = newHTML;
    // console.log(targetFrame.innerHTML);
  }

  #handleAttributes(data, target, attributeConfig) {
    for (const attr in attributeConfig) {
      if (data[attr]) target[attr] = data[attr];
      else if (attributeConfig[attr].default) target[attr] = attributeConfig[attr].default;
    }
  }

  #handleClasses(data, target, classConfig) {
    let classes = target.classList?.value ?? '';
    classes += this.#baseClass;
    classes += classConfig.default||'';
    for (const classType in classConfig) {
      if (classType !== 'default' && data[classType]) classes += ` ${data[classType]}`;
      else if (classConfig[classType].default) classes += ` ${classConfig[classType].default}`;
    }
    target.classList.value = classes;
  }

  #handleDataset(data, target, dataConfig) {
    for (const dataKey in dataConfig) {
      if (data[dataKey]) target.dataset[data] = data[dataKey];
      else if (dataConfig[data].default) target[data] = dataConfig[data].default;
    }
  }

  #createButtons(buttonData = [], template) {
    return buttonData.map(btn => {
      const newButton = document.createElement('button');
      if (template.buttons.html) newButton.innerHTML = template.buttons.html;
      // Handle replacers
      this.#processReplacers(btn, newButton, template.buttons.replacers);
      // Handle base properties
      newButton.innerHTML = (this.#validateProperty(btn.label)) ? btn.label : template.buttons.label.default;
      // Handle HTML Attribute properties
      this.#handleAttributes(btn, newButton, template.buttons.attributes);
      // Handle classes
      this.#handleClasses(btn, newButton, template.buttons.classes);
      // Handle dataset
      this.#handleDataset(btn, newButton, template.buttons.dataset);
      // Handle buttons and button functions
      if (btn.action && this.#validateProperty(template.buttons.action, btn.action)) newButton.addEventListener('click', btn.action);
      else if (template.buttons.action?.default) newButton.addEventListener('click', template.buttons.action.default);
      // TODO: closeframe and returndata only on left click... create a flag to override maybe?
      const closeFrameOnClick = btn.closeFrame ?? template.properties.closeFrame?.default ?? false,
        returnDataOnClick = btn.returnData ?? template.buttons.returnData?.default ?? false;
      if (closeFrameOnClick) {
        const targetParentClass = this.#baseClass;
        if (targetParentClass) newButton.addEventListener('click', (ev) => this.#closeFrame(ev, targetParentClass));
        else console.warn(`${this.constructor.name}: Bad parent class selector, closeFrame() function not applied`);
      }
      // Return data on mouseup to skip the 'click' queue
      this.#returnData(newButton, returnDataOnClick, template);
      return newButton;
    });
  }

  // Default behaviour is close frame on any button click. Must be overridden if not desired.
  #closeFrame(ev) {
    const parentFrame = ev.target.closest(`.${this.#baseClass}`);
    if (parentFrame) {
      this.#parentFrameControl.destroyModal(parentFrame);
    }
    else console.warn(`${this.constructor.name}: Could not close current frame, bad container class or frame not found`);
  }

  // Return data either directly through parent class, or via eventhub. Async/await version TBD
  #returnData(targetButton, returnData, /* template */) {
    const targetParentClass = this.#baseClass,
      buttonClicked = targetButton.name || targetButton.innerText;
    if (targetParentClass) {
      // targetButton.dataset.returndata = returnData;
      targetButton.addEventListener('mouseup', (ev) => {
        const parentFrame = ev.target.closest(`.${targetParentClass}`),
          parentId = parentFrame.id;
        let inputData = returnData
          ? (Array.from(parentFrame.querySelectorAll(['input', 'select', 'textarea']))||[]).map(el => { return { [el.name||el.tagName]: el.value } })
          : null;
        this.#parentFrameControl.eventsElement.dispatchEvent(new CustomEvent('returnModalData', { detail: { id: parentId, button: buttonClicked, data: inputData } }));
      });
    } else console.warn(`${this.constructor.name}: Could not find return data function or parent frame, no returnData function applied to button`);
  }

  create(templateData = {}) {
    const template = (templateData.template && this.this.templateNames.includes(templateData.template)) ? templateData.template : this.#defaultTemplate;
    const buttons = Array.isArray(templateData.buttons) ? this.#createButtons(templateData.buttons, template)
      : Array.isArray(template.buttons.defaultButtons) ? this.#createButtons(template.buttons.defaultButtons, template)
      : [];
    const containerFrame = document.createElement('div');
    containerFrame.innerHTML = template.html;
    const newFrame = containerFrame.children[0];
    if (!newFrame) return console.error('Bad HTML supplied to TemplateEngine');
    // newFrame.id = helpers.generateUID(); MOVED to framecontroller
    // Process buttons & replacers
    this.#processReplacers(templateData, newFrame, template.properties.replacers);
    // Handle HTML Attribute properties
    this.#handleAttributes(templateData, newFrame, template.properties.attributes);
    // Handle classes
    this.#handleClasses(templateData, newFrame, template.properties.classes);
    // Handle dataset
    this.#handleDataset(templateData, newFrame, template.properties.dataset);
    if (buttons.length && template.buttons.container) {
      const target = newFrame.querySelector(template.buttons.container);
      if (target) target.append(...buttons);
    }
    // Add closeFrame function to control button
    const controlButtonClose = template.properties.closeFrame?.controlButton ? newFrame.querySelector(template.properties.closeFrame.controlButton) : null;
    if (controlButtonClose) {
      if ((this.#validateProperty(template.properties.closeFrame, templateData.closeFrame) && !templateData.closeFrame) || !template.properties.closeFrame.default) {
        controlButtonClose.classList.add('disabled');
      } else {
        controlButtonClose.addEventListener('click', (ev) => this.#closeFrame(ev));
        this.#returnData(controlButtonClose, false, template);
      }
    } else console.warn(`Couldn't find control button - close`);
    return newFrame;
  }

}