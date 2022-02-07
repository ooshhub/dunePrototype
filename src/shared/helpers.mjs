// shared helpers for Browser environment, NO NODE IMPORTS
import * as convert from './Colours.mjs';

const helpers = (() => {
	
	let log;

	const setLog = (loggerLink) => {
		log = loggerLink || console.log;
		log('Logging set');
	}

	/* 
	// ASYNC, TIMING & PROCESS FUNCTIONS
	*/
	// Simple async timeout
	const timeout = async (ms) => new Promise(res => setTimeout(() => res(null), ms));
	// Simple condition watcher
	const watchCondition = async (func, message, timeout=5000, timeStep=100) => {
		return new Promise(res => {
			let elapsed = 0;
			let loop = setInterval(() => {
				if (func()) {
					clearInterval(loop);
					res(1);
					if (message) console.log(message);
				} else if (elapsed >= timeout) {
					res(null)
				}
				elapsed += timeStep;
			}, timeStep)
		});
	}
	// Load an async process against a timer. Default is 5000ms. Input in the form of:
	// 		{ name: myProcessName, load: myFunc(parameter), [timeout]: 8000 }
	// Returns an object with { err: 0 or 1, msg: string, stack: Error stack if applicable }
	// Timeout returns null, therefore any functions supplied as the payload CANNOT return 'null' on a success
	const asyncTimedLoad = async (loadPart) => {
		const defaultTimeout = 6000;
		let timer = loadPart.timeout ?? defaultTimeout;
		return new Promise(res => {
			Promise.race([
				loadPart.load,
				timeout(timer)
			]).then(partResult => {
				let result = (partResult === null) ? { err: 1, msg: `${loadPart.name}: timeout at ${timer}ms` }
					: (/error/i.test(partResult?.constructor?.name)) ? { err: 1, msg: `${loadPart.name}: ${partResult.message}`, stack: partResult.stack }
					// : (partResult === undefined) ? { err: 1, msg: partResult || `${loadPart.name}: Unknown Error` }
					: { err: 0, msg: `${loadPart.name}: Successful load.`};
				res(result);
			}).catch(err => {
				res({ err: 1, msg: err.message??err, stack: err.stack });
			});
		});
	}
	// Load an array of async processes to load. Same input as asyncTimedLoad, but an Array of processes.
	// Returns an object { failures: integer, errs: Array of error messages & stacktraces, msgs: Array of success msgs }
	// If returnObject.failures === 0, parallel load was successful.
	const parallelLoader = async (loaderArray) => {
		let promiseArray = loaderArray.map(part => asyncTimedLoad(part));
		let loaderResult = await Promise.all(promiseArray);
		let output = { failures: 0, msgs: [], errs: [] };
		loaderResult.forEach(subResult => {
			if (subResult.err) {
				output.failures += 1;
				output.errs.push(`${subResult.msg}${subResult.stack ? `\n===Stack===\n${subResult.stack}` : ''}`);
			} else {
				output.msgs.push(subResult.msg);
			}
		});
		return output;
	}


	/* 
	// DATA FUNCTIONS
	*/
	// Bind all methods in a class - call at end of constructor
	const bindAll = (inputClass) => {
		let keys = Object.keys(inputClass);
		console.log(keys);
		keys.forEach(k => {
			if (typeof(k) === 'function' && !/^#.+/.test(k)) {
				console.log(`Found private method: ${k}`);
			}
		})
	}
	const toArray = (inp) => Array.isArray(inp) ? inp : [inp];
	// Generate a player ID
	// Format is 
	//  -first letter of process.env.USERNAME (or random letter if not found)
	//  -underscore
	//  -18 alphanumeric characters made from username (or random) and Date.now()
	// is usable as object key name, and distinct from socket.io which doesn't use underscore
	const generatePlayerId = (pName) => {
		const randLetter = () => String.fromCharCode(Math.random() > 0.3 ? Math.ceil(Math.random()*26) + 64 : Math.ceil(Math.random()*26) + 96);
		pName = pName || '';
		if (!pName) {
			for (let i = Math.ceil(Math.random()*3) + 4; i > 0; i--) {
				pName += randLetter();
			}
		}
		let name = pName.split('').reduce((a,v) => a += v.charCodeAt(0), '');
		name = parseInt(name).toString(36).replace(/0*$/, '');
		let time = (Math.floor(Date.now())).toString(16);
		let pid = `${time}${name}`;
		if (pid.length > 20) pid = pid.slice(0,20);
		else if (pid.length < 20) { for(let i = (20 - pid.length); i > 0; i--) { pid += randLetter() } }
		pid = `${pName[0]}_${pid.slice(2)}`;
		return pid;
	}
	// Convert a string path to a nested object reference
  // e.g. getObjectPath(myObj, 'config/player/playerName) returns myObj.config.player.playerName
  // Set createPath to false to disabled creating missing keys. Will return null if path not found
	const getObjectPath = (baseObject, pathString, createPath=true) => {
		let parts = pathString.split(/\/+/g);
		let objRef = (pathString) 
			? parts.reduce((m,v) => {
        if (!m) return;
				if (!m[v]) {
          if (createPath) m[v] = {};
          else return null;
        }
				return m[v];}, baseObject)
			: baseObject;
		return objRef;
	}
  // Remove cyclic references from an object, supply stringify flag if required
	const removeCyclicReferences = (inputObj, stringify) => {
		const getCircularReplacer = () => {
			const seen = new WeakSet();
			return (key, value) => {
				if (typeof value === "object" && value !== null) {
					if (seen.has(value)) {
						return;
					}
					seen.add(value);
				}
				return value;
			};
		};
		let output;
		try { output = JSON.stringify(inputObj, getCircularReplacer()) } catch(e) { console.error(e); return null }
		return stringify ? output : JSON.parse(output);
	}


	/*
	// HTML / JS / CSS FUNCTIONS
	*/
	const windowFade = async (targetFrame, duration, direction, timeStep=10) => {
		let opacityStep = timeStep/duration;
		let uOpacity = parseFloat(targetFrame.getOpacity()) ?? null;
		if (uOpacity === null) return console.log(`No opacity found on target Electron frame.`);
		direction = /^(in|out)/.test(`${direction}`) ? direction
			: (uOpacity < 0.5) ? 'in'
			: 'out';
		// console.log(`Fading window ${direction} with a step of ${opacityStep} from initial ${uOpacity}`);
		return new Promise(res => {
			let opacity = uOpacity;
			let fadeLoop = setInterval(() => {
				if ((direction === 'in' && opacity >= 1)
				|| (direction === 'out' && opacity <= 0)) {
					clearInterval(fadeLoop);
					res(1);
				} else {
					if (direction === 'in') opacity += opacityStep;
					if (direction === 'out') opacity -= opacityStep;
					targetFrame.setOpacity(opacity);
				}
			}, timeStep);
		});
	}

	/**
	 * COLOUR FUNCTIONS
	 */
	const satMax = 100, satMin = 40, lumMax = 80, lumMin = 30;
	const normaliseHsl = (hexColor) => {
		const hsl = convert.hexToHsl(hexColor);
		if (hsl?.stack) {
			log(`Error converting color: ${hexColor}`, hsl);
			return null;
		}
		// console.log(hsl);
		hsl[1] = Math.min(Math.max(hsl[1], satMin), satMax);
		hsl[2] = Math.min(Math.max(hsl[2], lumMin), lumMax);
		return convert.hslToHex(hsl);
	}

	/**
	 * OTHER FUNCTIONS
	 */
	const emproper = (input) => {
		if (typeof(input) !== 'string') return;
		let words = input.replace(/_/g, ' ').trim().split(/\s+/g);
		let Words = words.map(w => `${w[0].toUpperCase()}${w.slice(1)}`);
		return Words.join(' ');
	}

	return {
		setLog,
		timeout, watchCondition, asyncTimedLoad, parallelLoader,
		bindAll, toArray, generatePlayerId, getObjectPath, removeCyclicReferences,
		windowFade,
		normaliseHsl,
		emproper
	}

})();



export { helpers };