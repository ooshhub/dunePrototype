// Renderer entry point
// Dependencies
import { helpers } from '../shared/helpers.mjs';
import { SessionState } from './net/SessionState.mjs';
import { DuneStore } from './DuneStore.mjs';

// TODO: replace with DuneStore class with getters & setters to protect data structure
// SS: try Proxy or ServiceContainer
// const Dune = {
// 	Houses: {},
//   RenHub: null,
// 	Players: {},
// 	Layers: {},
// 	Helpers: helpers,
// 	Client: null,
// 	CONFIG: null,
// 	Session: null,
// 	ActivePlayer: {},
// }

const Dune = new DuneStore();

window.Dune = Dune;
window.$ = (selector) => document.querySelector(selector);
window.$$ = (selector) => document.querySelectorAll(selector);

let renHub, rlog;

// Initialise
(async () => {
	let err;
	await import('./rendererHub.mjs')
		.then(imp => {
			rlog = imp.rlog;
			renHub = imp.renHub;
			Dune.renHub = renHub;
			Dune.logger = rlog;
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

	// Check for existing session
	await helpers.watchCondition(() => Dune.config);
	// const newSession = new SessionState(Dune.config?.userSettings?.player);
	// rlog(newSession.constructor.name);
	// Dune.session = newSession;
	Dune.session = new SessionState(Dune.config?.userSettings?.player);
	const resumeSession = sessionStorage.getItem('DuneSession');
	rlog([`Previous Session Store: `, JSON.parse(resumeSession)]);
	let prevSession, currentState, reconnectObject, prevStore;
	if (resumeSession) {
		prevSession = await Dune.session.restore(resumeSession);
		// rlog([`Prev Session:`, prevSession]);
		currentState = prevSession.state;
		reconnectObject = prevSession.reconnect;
		prevStore = prevSession.store;
		// rlog([`Prev Store:`, prevStore]);
	} else {
		Dune.session.init(Dune.config?.userSettings?.player);
		currentState = Dune.session.getSessionState();
	}


	// Load core modules
	await helpers.parallelLoader([
		{ name: 'initCanvas', load: (await import('./canvas/stageManager.mjs')).initCanvas() },
		{ name: 'initMainMenu', load: (await import('./mainMenu/mainMenu.mjs')).initMainMenu(), },
		{ name: 'initUI', load: (await import('./ui/ui.mjs')).initUi() }
	]).then(async (res) => {
		if (res.failures > 0) throw new Error(res.errs.join('\n'));
		rlog(res.msgs.join('\n'));
		rlog('===Core modules completed===');
		//TODO: Put this section somewhere else??? Don't want it in SessionState though, it shouldn't be controlling systems
		// Deal with existing session if applicable
		let shown;
		switch(currentState) {
			// TODO: Index HTML selectors somewhere as well?
			case 'ERROR': break;
			case 'UNKNOWN': break;
			default: break;
			case 'LOBBY':
				// Falls through
			case 'GAME':
				rlog([`Attempting to reconnect to server: `, { serverOptions: reconnectObject }]);
				renHub.trigger('joinServer', { serverOptions: reconnectObject });
				if (await helpers.watchCondition(() => Dune.client?.socket?.connected, 'Reconnect Successful?', 5000)) {
					if (currentState === 'LOBBY') renHub.trigger('server/requestLobby', reconnectObject);
					// ELSE retrieve canvas state
				} else {
					rlog(`Reconnect attempt failed.`);
					Dune.session?.update?.('MENU');
				}
				// Falls through
			case 'MENU':
				// ({ shown, hidden } = Dune.Session.getInterfaceStatus());
				// rlog(prevStore?.ui);
				shown = prevStore?.ui?.shown?.length ? prevStore.ui.shown : ['main#mainmenu'];
				// rlog([`Restoring UI elements from store: `, shown]);
				renHub.trigger('fadeElement', shown, 'in', 1000);
		}
		renHub.trigger('main/coreLoadComplete');
		$('input[name="unpackaged"]').value = 1;
	}).catch(e => err = e);
	if (err) return rlog(['Client load had errors.', err], 'error');
	rlog(Dune.config);

	// Load other modules
	await helpers.parallelLoader([
		{ name: 'howlerAudio', load: (await import('./audio/audio.mjs')).initAudio() },
		{ name: 'chatSystem', load: (await import('./chat/chat.mjs')).initChat() }
	]).then(res => {
		if (res.failures === 0) rlog(res.msgs.join('\n'));
		else rlog(res.errs.join('\n'), 'error');
	});

})();