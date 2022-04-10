import { Container } from './test2.mjs';

export class Serialiser {

  static serialise(target, options = {}) {
  // Default options
    Object.assign(options, {
      includeMethods: options.includeMethods ?? false,
      privateWhitelist: options.privateWhitelist || 'appendFields',
      publicBlacklist: options.publicBlacklist || 'blockFields'
    });

//// Move all these sub functions out to private static methods if needed elsewhere
  // Simple copy object
    const copyObj = (inp) => typeof(inp) === 'object' ? JSON.parse(JSON.stringify(inp)) : inp;
  // Grab private field references. Function must be bound to target class instance.
    const processPrivates = function() {
      let appendPrivates = {};
      const privateFields = this[options.privateWhitelist] || {};
      for (const field in privateFields) {
        appendPrivates[field] = privateFields[field];
      }
      return appendPrivates;
    }
  // Function clone, if required
    const copyFunction = (originalFunction) => {
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
  // Main process
    const processObject = (targetObj) => {
      const processKeys = (baseObj) => {
        for (const prop in baseObj) {
          if (blacklist.includes(prop)) continue; // Skip blocked public fields
          if (typeof(baseObj[prop]) === 'object') output[prop] = processObject(baseObj[prop]); // Recursion for nested objects
          else {
            if (typeof(baseObj[prop]) === 'function' && options.includeMethods) {
              const cloneFunc = copyFunction(baseObj[prop]); // optional method copy
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
      if (conName !== 'Object' && conName !== 'Array') Object.assign(toAppend, processPrivates.bind(targetObj)());
      processKeys(targetObj);
      processKeys(toAppend);
      return output;
    }

  // Push the button that makes things go
    return typeof(target) === 'object' ? processObject(target) : new Error(`Non-object passed to serialiser.`);
  }
}

const Cont = new Container;

const clone = Serialiser.serialise(Cont)//, {includeMethods: true});

console.log(clone);

console.log('brk');