import { Container } from './test2.mjs';

class Serialiser {

	static serialise(target, options = { includeMethods: false }) {

		const copyObj = (inp) => typeof(inp) === 'object' ? JSON.parse(JSON.stringify(inp)) : inp;

		const processPrivates = function() {
			let pvt = {};
			const fields = this.privateFields || [];
			fields.forEach(field => {
				const name = field.name || field.constructor?.name || '_';
				pvt[`_${name}`] = field;
			});
			return pvt;
		}

		// placeholder
		const copyFunction = () => {
			return () => console.log('fuckn stuff');
		}

		const processObject = (baseObj) => {
			let output = {};
			const conName = target.constructor?.name || '';
			if (conName === 'Array') output = baseObj;
			else {
				let clone = copyObj(baseObj);
				if (conName !== 'Object') Object.assign(clone, processPrivates.bind(baseObj)());
				for (const prop in clone) {
					if (typeof(clone[prop]) === 'object') output[prop] = processObject(clone[prop]);
					else {
						if (typeof(output[prop]) === 'function' && options.includeMethods) {
							output[prop] = copyFunction(clone[prop]);
						} else {
							output[prop] = clone[prop];
						}
					}
				}
			}
			return output;
		}
		return processObject(target);
	}

}

const Cont = new Container;

// console.log(Container);

const clone = Serialiser.serialise(Cont);

console.log(clone);

console.log('brk');