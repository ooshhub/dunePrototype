import { slog } from "../../serverHub.mjs";

export class Model {

  /**
   * Type validation for all Models
   */
  static #types = {
    any: {
      validate: function() { return true }
    },
    string: {
      validate: function(value) { return typeof(value) === 'string'; },
      subTypes: {
        uid: {
          validate: function(value) { return /[0-z]{20}/.test(value); }
        }
      }
    },
    number: {
      validate: function(value) { return (typeof(value) === 'number' && !isNaN(value)); }
    },
    integer: {
      validate: function(value) { return Number.isSafeInteger(value); }
    },
    float: {
      validate: function(value) { return (typeof(value) === 'number' && /\./.test(`${value}`)); }
    },
    boolean: {
      validate: function(value) { return (typeof(value) === 'boolean') }
    },
    array: {
      validate: function(value) { return (Array.isArray(value)) }
    }
    // TODO: rest of types
  }

  /**
   * Validate a data object for use in constructing or updating a Model
   * @param {object} modelProperties - all types allowed on Model
   * @param {object} modelData - the Model properties passed to either constructor() or update(), to be validated
   * @returns {?object} validated properties or null
   */
  static #validate(modelProperties, modelData) {
    const output = {},
      warnings = [],
      errors = [];
    for (const prop in modelProperties) {
      if (errors.length) break;
      if (!modelProperties) {
        errors.push(`Model must provide a modelProperties object.`);
        break;
      }
      if (!modelProperties[prop].type) {
        warnings.push(`No type was declared for property "${prop}".`);
        continue;
      }
      // Set to default if a default is provided and value if undefined
      if (modelData[prop] === undefined && modelProperties[prop].default) modelData[prop] = modelProperties[prop].default;
      const typeParts = modelProperties[prop].type?.trim().split(/\s*:\s*/g),
        nullable = /^\?/.test(modelProperties[prop].type),
        mainType = typeParts[0].replace(/^\?/, ''),
        subTypes = typeParts[1] ? typeParts[1].split(/\s*,\s*/g) : null,
        mainTypeValidator = Model.#types[mainType]?.validate;
      // Check a validator exists for this type
      if (!mainTypeValidator) {
        if (modelProperties[prop].required) {
          errors.push(`Validator does not exist for required type ${modelProperties[prop].type}.`);
          break;
        }
        else {
          warnings.push(`Validator does not exist for type ${modelProperties[prop].type}.`);
          continue;
        }
      }
      // Run the main validation
      if ((nullable && modelData[prop] === null) || mainTypeValidator(modelData[prop])) {
        // Check any subTypes
        if (subTypes) {
          subTypes.forEach(subType => {
            if (!errors.length) {
              const subTypeValidator = Model.#types[subType]?.validate;
              if (!subTypeValidator) {
                if (modelProperties[prop].required) errors.push(`Validator does not exist for required subType "${subType}".`);
                else warnings.push(`Validator does not exist for subType "${subType}".`);
              }
              else if (!subTypeValidator(modelData[prop])) {
                if (modelProperties[prop].required) errors.push(`Required property "${prop}" failed validation for subType "${subType}".`);
                else warnings.push(`Property "${prop}" failed validation for subType "${subType}".`);
              }
            }
          });
          if (errors.length) break;
        }
        // Assign the validated value to output
        output[prop] = modelData[prop];
      }
      else {
        if (modelProperties[prop].required) errors.push(`Required property "${prop}" failed validation for main type "${modelProperties[prop].type}".`);
        else warnings.push(`Property "${prop}" failed validation for main type "${modelProperties[prop].type}".`);
      }
    }
    if (errors.length) {
      console.error(...errors);
      return null;
    }
    if (warnings.length) {
      console.warn(...warnings);
    }
    return output;
  }

  constructor(id, modelData, modelProperties) {
    if (!id || typeof(id) !== 'string') return null;
    const validated = Model.#validate(modelProperties, modelData);
    if (validated) {
      Object.assign(this, validated);
      this.id = id;
      this.logger = slog;
    }
  }

  /**
   * Generate a random integer - used by generateUID below
   * @param {integer} range 
   * @param {integer} depth 
   * @returns {integer} - random integer from 0 to <range>
   */
  static #randomInt(range=100, depth=32) {
    const max = range * 2**depth;
    let random;
    do { random = Math.floor(Math.random() * 2**depth) }
    while (random >= max);
    return random % range;
  }
  /**
   * Generate a 20-character UID, firebase RTD style
   * @param {integer} numIds - number of ids required
   * @returns {string | Array.<string>}
   */
  static generateUID(numIds = 1) {
    let output = [], key = '';
    const chars = '-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    let ts = Date.now();
    for (let i = 8; i > 0; i--) { output[i] = chars.charAt(ts % 64), ts = Math.floor(ts / 64) }
    for (let j = 0; j < 12; j++) { output.push(chars.charAt(this.#randomInt(64))) }
    key = output.join('');
    if (numIds > 1) {
      numIds = Math.min(32, numIds);
      output = Array(numIds).fill().map((v,i) => {
        let lastChar = chars[(chars.indexOf(key[19])+i)%64];
        return `${key.slice(0,18)}${lastChar}`;
      });
      return output;
    } else return key;
  }

  /**
   * Generic update function, call from subclass with privat model properties passed in
   * @param {object} updateData - Model properties to update
   * @param {object} modelProperties - Model type definitions for validation
   * @returns {?Model}
   */
  update(updateData = {}, modelProperties = {}) {
    const validData = Model.#validate(updateData, modelProperties);
    if (validData) {
      Object.assign(this, validData);
      return this;
    }
    else return null;
  }


}