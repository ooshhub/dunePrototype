import { rlog } from './rendererHub.mjs';

export const ren = (() => {
	/*
	// HTML & CONFIG REQUEST
	*/
	// Insert rendered HTML to game view
	const insertHtml = (data) => {
		if (data.html) {
			if (data.req === 'canvas') document.querySelector('main#gamecanvas').innerHTML = (data.html);
			else if (data.req === 'ui') document.querySelector('main#gameui').innerHTML = (data.html);
			else if (data.req === 'chat') document.querySelector('main#chat').innerHTML = (data.html);
			else if (data.req === 'mainmenu') document.querySelector('main#mainmenu').innerHTML = (data.html);
			else if (data.req === 'ingamemenu') document.querySelector('dialog#ingamemenu').innerHTML = (data.html);
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