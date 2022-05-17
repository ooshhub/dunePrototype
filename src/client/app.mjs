// Renderer entry point
// Dependencies
import { helpers } from '../shared/helpers.mjs';
import { DuneStore } from './DuneStore.mjs';
import { RendererInterface } from './RendererInterface.mjs';
import { SessionState } from './net/SessionState.mjs';

// SS: try Proxy or ServiceContainer
const Dune = new DuneStore();
const rendererInterface = new RendererInterface();

window.Dune = Dune;
window.$ = (selector) => document.querySelector(selector);
window.$$ = (selector) => document.querySelectorAll(selector);

export const renHub = rendererInterface.renHub,
  rendererHub = rendererInterface.rendererHub,
  rlog = rendererInterface.rlog;
Dune.renHub = rendererInterface.renHub;
Dune.rlog = rendererInterface.rlog;
Dune.logger = rlog;
Dune.frames = rendererInterface.frameControl;

export const frameControl = rendererInterface.frameControl;

// Initialise
(async () => {
  let err;
  if (!err) {
    rlog('===Client load starting===');
    // Request intial HTML & Config
    renHub.trigger('main/requestHtml', {req: ['canvas', 'ui', 'chat', 'mainmenu']});
    renHub.trigger('main/requestConfig');
  } else return console.error('Aborting client load due to errors.');

  // Check for existing session
  await helpers.watchCondition(() => Dune.config);
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
    currentState = Dune.session.state;
  }

  // Load core modules
  await helpers.parallelLoader([
    { name: 'initCanvas', load: (await import('./canvas/StageManager.mjs').then((v) => v.StageManager.initCanvas())) },
    { name: 'initMainMenu', load: (await import('./mainMenu/mainMenu.mjs')).initMainMenu(), },
    { name: 'initUI', load: (await import('./ui/ui.mjs')).initUi() },
    { name: 'initMentat', load: (await import('./mentat/thufir.mjs').then(v => window.Dune.mentat = v.MentatSystem )) },
  ]).then(async (res) => {
    if (res.failures > 0) throw new Error(res.errs.join('\n'));
    rlog(res.msgs.join('\n'));
    rlog('===Core modules completed===');
    //TODO: Put this section somewhere else??? Don't want it in SessionState though, it shouldn't be controlling systems
    // Deal with existing session if applicable
    let visibleElements = prevStore?.ui?.shown?.length ? prevStore.ui.shown : ['main#mainmenu|fc-fade-in-slow'];
    switch(currentState) {
      case 'ERROR': break;
      case 'UNKNOWN': break;
      default: break;
      case 'LOBBY':
        // Falls through
      case 'GAME':
        rlog([`Attempting to reconnect to server: `, { serverOptions: reconnectObject }]);
        renHub.trigger('joinServer', { serverOptions: reconnectObject });
        if (await helpers.watchCondition(() => Dune.client?.socket?.connected, 'Reconnect Successful?', 5000)) {
          // Reconnect successful - add GameCanvas to ignore list, as the board setup will bring that element up itself
          visibleElements = visibleElements.filter(el => !~el.indexOf('#gamecanvas'));
        } else {
          rlog(`Reconnect attempt failed.`);
          Dune.session?.update?.('MENU');
        }
        // Falls through
      case 'MENU':
        visibleElements.forEach(el => {
          const parts = el.split('|');
          document.querySelector(parts[0])?.classList.add(parts[1]);
          document.querySelector(parts[0])?.classList.remove('hide');
        });
    }
    renHub.trigger('coreLoadComplete');
    $('input[name="unpackaged"]').value = 1;
  }).catch(e => err = e);
  if (err) return rlog(['Client load had errors.', err], 'error');


  // Load other modules
  await helpers.parallelLoader([
    { name: 'howlerAudio', load: (await import('./audio/audio.mjs')).initAudio() },
    { name: 'chatSystem', load: (await import('./chat/chat.mjs')).initChat() }
  ]).then(res => {
    if (res.failures === 0) rlog(res.msgs.join('\n')); // May need to update a ready state here
    else rlog(res.errs.join('\n'), 'error');
  });


})();