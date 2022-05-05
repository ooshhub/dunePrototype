// import { helpers } from "../../shared/helpers.mjs";
const helpers = { generateUID: () => `-fakeid` }

/* export */ class TemplateEngine {

  #templates = {};
  #defaultTemplate = null;
  
  #activeTemplate = null;
  #activeConstruct = null;

  #fallbackContainerClass = 'new-template-frame';

  constructor(templateData) {
    if (!templateData || !Object.keys(templateData).length) return null;
    for (const template in templateData) {
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

  #processReplacers(data, target, replacerConfig) {
    if (!Object.keys(replacerConfig).length) return;
    let newHTML = target.innerHTML;
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
    target.innerHTML = newHTML;
  }

  #handleAttributes(data, target, attributeConfig) {
    for (const attr in attributeConfig.attributes) {
      if (data.attributes[attr]) target[attr] = data[attr];
    }
  }

  #handleClasses(data, target, classConfig) {
    let classes = target.classList?.value ?? classConfig.default ?? '';
    for (const classType in classConfig) {
      if (classType === 'default' || data[classType]) classes += ` ${data[classType]}`;
    }
    target.classList.value = classes;
  }

  #handleDataset(data, target, dataConfig) {
    for (const dataKey in dataConfig) {
      if (data[dataKey]) target.dataset[data] = data[dataKey];
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
      const closeFrameOnClick = btn.closeFrame ?? template.buttons.closeFrame?.default ?? false,
        returnDataOnClick = btn.returnData ?? template.buttons.returnData?.default ?? false;
      if (closeFrameOnClick) newButton.addEventListener('click', this.#closeFrame);
      // Return data on mouseup to skip the 'click' queue
      if (returnDataOnClick) newButton.addEventListener('mouseup', this.#returnData)
      return newButton;
    });
  }

  // Default behaviour is close frame on any button click. Must be overridden if not desired.
  // Also needs to be applied to .control-close button in top right
  #closeFrame(ev) {
    const targetParentClass = this.#activeTemplate.properties?.classes?.default ?? this.#fallbackContainerClass;
    const parentFrame = ev.target.closest(targetParentClass);
    if (parentFrame) parentFrame.remove();
    else console.warn(`${this.constructor.name}: Could not close current frame, bad container class or frame not found`);
  }

  // Return data either directly through parent class, or via eventhub. Async/await version TBD
  #returnData() { }

  create(templateData = {}) {
    const template = (templateData.template && this.this.templateNames.includes(templateData.template)) ? templateData.template : this.#defaultTemplate;
    this.#activeTemplate = template;
    const buttons = Array.isArray(templateData.buttons) ? this.#createButtons(templateData.buttons, template)
      : Array.isArray(template.buttons.defaultButtons) ? this.#createButtons(template.buttons.defaultButtons, template)
      : [];
    const containerFrame = document.createElement('div');
    containerFrame.innerHTML = template.html;
    const newFrame = containerFrame.children[0];
    if (!newFrame) return console.error('Bad HTML supplied to TemplateEngine');
    newFrame.id = helpers.generateUID();
    this.#activeConstruct = newFrame;
    // Process buttons & replacers
    // newFrame.innerHTML = template.html;//.replace(/\n/g, '');
    this.#processReplacers(templateData, newFrame, template.properties.replacers);
    // Handle HTML Attribute properties
    this.#handleAttributes(templateData, newFrame, template.properties.attributes);
    // Handle classes
    this.#handleClasses(templateData, newFrame, template.properties.classes);
    // Handle dataset
    this.#handleDataset(templateData, newFrame, template.properties.dataset);
    // console.log(newFrame.querySelector('footer button').onclick);
    if (buttons.length && template.buttons.container) {
      const target = newFrame.querySelector(template.buttons.container);
      if (target) target.append(...buttons);
    }
    this.#activeTemplate = null;
    this.#activeConstruct = null;
    return newFrame;
  }

}