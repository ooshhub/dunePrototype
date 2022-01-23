import { rlog, renHub } from '../rendererHub.mjs';

export const MentatSystem = (() => {

	const load = ({ target, data }) => {
		if (!target || !data) return rlog(`Thufir didn't understand the request: ${target}:${data}`, 'warn');
		rlog(`Thufir received data request for ${target}:${data}`);
		// Fetch the template for the target element
		// Fetch the required data from the help file
		// Send off HTML request to main process
		renHub.trigger('main/req');
	}

	return { load }

})();