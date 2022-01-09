import { rlog } from './rendererHub.mjs';

export const ren = (() => {
	const $ = (selector) => window.document.querySelector(selector);
	/*
	// HTML & CONFIG REQUEST
	*/
	// Insert rendered HTML to game view
	const insertHtml = async (data) => {
		if (data.html) {
			if (data.req === 'canvas') $('main#gamecanvas').innerHTML = (data.html);
			else if (data.req === 'ui') $('main#gameui').innerHTML = (data.html);
			else if (data.req === 'chat') $('main#chat').innerHTML = (data.html);
			else if (data.req === 'mainmenu') $('main#mainmenu').innerHTML = (data.html);
			else if (data.req === 'ingamemenu') $('dialog#ingamemenu').innerHTML = (data.html);
		} else rlog(data.err||`Unknown Error from "${data.html}" request.`, 'error');
	};

	// Update CONFIG in browser window
	const updateConfig = ({ CONFIG }) => {
		rlog([`Received game data: `, CONFIG]);
		window.Dune.CONFIG = CONFIG;
	}

	return {
		insertHtml, updateConfig
	}
	
})();