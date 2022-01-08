// Renderer entry point
// Dependencies


const Dune = {
	Houses: {},
  LocalHub: null,
	Players: {},
	Layers: {},
	Utils: {},
	Client: {},
	CONFIG: {},
}
window.Dune = Dune;

let renHub, rlog;

(async () => {
	let err;
	await import('./rendererHub.mjs')
		.then(imp => {
			rlog = imp.rlog;
			renHub = imp.renHub;
		})
		.catch(e => {
			console.error(e);
			err = e;
		});
	if (!err) {
		rlog('===Client load started===');
		// Request initial game data
		renHub.trigger('main/requestHtml', {req: 'canvas'});
		renHub.trigger('main/requestHtml', {req: 'ui'});
		renHub.trigger('main/requestHtml', {req: 'chat'});
		renHub.trigger('main/requestHtml', {req: 'mainmenu'});
		renHub.trigger('main/requestConfig');
	} else return console.error('Exiting client load due to errors.');

	// Await load of initial scripts
	// Initialise canvas & audio

})();