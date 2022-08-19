// import { Helpers } from "./Helpers.mjs";

export class Serialiser {

  // Simple copy object
  static #copyObj(inp) { typeof(inp) === 'object' ? JSON.parse(JSON.stringify(inp)) : inp }
  
  // Grab private field references. Function must be bound to target class instance.
  static #processPrivates(whitelistName) {
    let appendPrivates = {};
    const privateFields = this[whitelistName] || {};
    for (const field in privateFields) {
      appendPrivates[field] = privateFields[field];
    }
    return appendPrivates;
  }

  // Function clone, if required
  static #copyFunction(originalFunction) {
    const rxParams = /^[^(]*\(([^)]*)\)\s*(=>)?(.*)/i;
    let body, params, output, error;
    `${originalFunction}`.replace(rxParams, (m, p1, p2, p3) => {
      body = p3 ?? null;
      params = p1?.split(/\s*,\s*/g) ?? [];
    });
    try { output = new Function(...params, body) }
    catch(e) { error = e }
    return output ? output : { err: error }
  }

  static serialise(target, options = {}) {
    // Default options
    Object.assign(options, {
      includeMethods: options.includeMethods ?? false,
      privateWhitelist: options.privateWhitelist || 'appendFields',
      publicBlacklist: options.publicBlacklist || 'blockFields'
    });
    // Main process
    const seen = new WeakSet();
    const processObject = (targetObj) => {
      // if (seen.has(targetObj)) return;
      seen.add(targetObj);
      const processKeys = (baseObj) => {
        for (const prop in baseObj) {
          if (blacklist.includes(prop)) continue; // Skip blocked public fields
          if (typeof(baseObj[prop]) === 'object' && baseObj[prop] !== null) {
            if (seen.has(baseObj[prop])) { output[prop] = baseObj[prop]; continue }// MAYBE FIX???
            else output[prop] = processObject(baseObj[prop]); // Recursion for nested objects
          }
          else {
            if (typeof(baseObj[prop]) === 'function' && options.includeMethods) {
              const cloneFunc = this.#copyFunction(baseObj[prop]); // optional method copy
              if (!cloneFunc.err) output[prop] = cloneFunc; 
            } else {
              output[prop] = baseObj[prop]; // primitives
            }
          }
        }
      }
      const output = Array.isArray(targetObj) ? [] : {},
        conName = target.constructor?.name || '',
        toAppend = {},
        blacklist = targetObj[options.publicBlacklist] || [];
      // Grab whitelisted private fields, if any
      if (conName !== 'Object' && conName !== 'Array') Object.assign(toAppend, this.#processPrivates.bind(targetObj)(options.privateWhitelist));
      processKeys(targetObj);
      processKeys(toAppend);
      return output;
    }
    // Push the button that makes things go
    return (typeof(target) === 'object' && target !== null) ? processObject(target) : new Error(`Non-object or null passed to serialiser.`);
  }

}