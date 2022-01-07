// shared helper functions requiring Node imports
export const helpers = (() => {

	const timeout = async (ms) => new Promise(res => setTimeout(() => res(null), ms));

	const loadPart = async (loadPart) => {
		const defaultTimeout = 5000;
		return new Promise((res, rej) => {
			Promise.race([
				res(loadPart.load),
				rej(timeout(loadPart.timeout ?? defaultTimeout))
			]);
		});
	}

	const asyncLoader = async (loaderArray) => {
		// const defaultTimeout = 5000;
		let promiseArray = loaderArray.map(part => {
			// let timer = part.timeout ?? defaultTimeout;
			loadPart(part)
		});
		console.log(`Promise array has been constructed`);
		return await Promise.all(promiseArray);
	}
})();