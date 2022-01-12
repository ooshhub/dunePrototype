// Renderer entry point
// Dependencies
import { helpers } from '../shared/helpers.mjs';

const Dune = {
	Houses: {},
  RenHub: null,
	Players: {},
	Layers: {},
	Helpers: helpers,
	Client: null,
	CONFIG: {},
}
window.Dune = Dune;
window.$ = (selector) => document.querySelector(selector);
window.$$ = (selector) => document.querySelectorAll(selector);

let renHub, rlog;

(async () => {
	let err;
	await import('./rendererHub.mjs')
		.then(imp => {
			rlog = imp.rlog;
			renHub = imp.renHub;
			window.Dune.RenHub = renHub;
			window.Dune.Helpers.rlog = rlog
		})
		.catch(e => {
			console.error(e);
			err = e;
		});
	if (!err) {
		rlog('===Client load starting===');
		// Request intial HTML & Config
		renHub.trigger('main/requestHtml', {req: ['canvas', 'ui', 'chat', 'mainmenu']});
		renHub.trigger('main/requestConfig');
	} else return console.error('Aborting client load due to errors.');

	// Load core modules
	await helpers.parallelLoader([
		{ name: 'initCanvas', load: (await import('./canvas/stageManager.mjs')).initCanvas() },
		{ name: 'initMainMenu', load: (await import('./mainMenu/mainMenu.mjs')).initMainMenu() }
	]).then(res => {
		if (res.failures > 0) throw new Error(res.errs.join('\n'));
		// If successful, bring up main window
		rlog(res.msgs.join('\n'));
		rlog('===Core modules completed===');
		renHub.trigger('main/coreLoadComplete');
	}).catch(e => err = e);
	if (err) return rlog('Aborting client load due to errors.', 'error');

	// Load other modules
	await helpers.parallelLoader([
		{ name: 'howlerAudio', load: (await import('./audio/audio.mjs')).initAudio() }
	]).then(res => {
		if (res.failures === 0) rlog(res.msgs.join('\n'));
		else rlog(res.errs.join('\n'), 'error');
	});


})();