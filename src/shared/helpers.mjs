// shared helpers for Browser environment, NO NODE IMPORTS
const helpers = (() => {

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
					: (partResult === undefined) ? { err: 1, msg: partResult || `${loadPart.name}: Unknown Error` }
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


	return { 
		timeout, watchCondition, asyncTimedLoad, parallelLoader,
		generatePlayerId,
	}

})();

export { helpers };