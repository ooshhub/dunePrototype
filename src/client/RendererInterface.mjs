// New RendererInterface to replace this.renHub/renfunctions

// Event hub landing for client
import { EventHub } from '../shared/EventHub.mjs';
import { DebugLogger, DebugReceiver } from '../shared/DebugLogger.mjs';
import { RendererUtilities } from './RendererUtilities.mjs';
import { LobbyFunctions } from './lobby/LobbyFunctions.mjs';
import { FrameController } from './ui/FrameController.mjs';
import * as duneTemplates from './ui/templates_dune.mjs';

// DEBUG - switch contexts on or off to remove debug logging
// TODO: move to real time config inside Receiver class
const debugSources = {
  main: 1,
  server: 1,
  socket: 1,
  renderer: 1,
}

export class RendererInterface {

  static #instance = null;
  #rendererHub = {};
  #rendererLogger = {};
  #debugReceiver = {};

  #frameControl = {};

  constructor() {
    if (RendererInterface.instance) return RendererInterface.instance;
    this.#rendererHub = new EventHub('rendererHub');
    this.#rendererLogger = new DebugLogger('renderer', this.#rendererHub, debugSources.renderer, 0);
    this.#debugReceiver = new DebugReceiver(this.#rendererHub, debugSources);
    this.#debugReceiver.registerHandlers();
    this.#eventRouting();

    this.#frameControl = new FrameController({
        rootElement: window.document,
        containers: {
          body: window.document.body
        },
        disableFlag: `body input[name="disable-main"]`,
      },
      duneTemplates,
      this.#rendererHub
    );

    this.utilities = new RendererUtilities(this);
    this.lobby = new LobbyFunctions(this);

    this.#initHandlers();
    // this.#loadDebugMenu(); can't load yet, target layers are not loaded

    RendererInterface.instance = this;
  }

  // instance check
  static get instance() { return this.#instance }
  static set instance(newInterface) { this.#instance = this.#instance ?? newInterface }

  get rlog() { return this.#rendererLogger }
  get renHub() { return this.#rendererHub }
  get rendererHub() { return this.#rendererHub }
  get frameControl() { return this.#frameControl }

  #eventRouting() {
    // Event messaging
    // TODO: figure out what I was doing with this ACK shit... is it obsolete now?
    window.rendererToHub.receive('sendToRenderer', async (event, data) => {
      if (data.ack) console.warn(`event "${event}" requires Ack, ensure it is handled`);
      this.renHub.trigger(event, data);
    });
    this.renHub.for('main', async (event, ...args) => window.rendererToHub.send('sendToMain', event, ...args));
    // Server messaging. Attach ids to data
    this.renHub.for('server', (event, data, ...args) => {
      if (!window.Dune?.client) return;
      data = data == undefined ? {} : data;
      try {	Object.assign(data, {
          pid: window.Dune.pid,
          hid: window.Dune.hid });
      } catch(e) { this.rlog(`Bad data object sent to server, could not attach ids`, 'warn') }
      window.Dune.client.sendToServer(event, data, ...args);
    });
    // Self-routing
    this.renHub.for('renderer', (event, ...args) => this.renHub.trigger(event, ...args));
  }

  async #loadDebugMenu() {
    const html = await fetch('./debugMenu.html').then(data => data.text());
    if (!html) return console.error('No DEBUG found');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    // console.log(wrapper);
    document.querySelector('#gameui').append(wrapper.firstElementChild);
    await import('./ui/debugMenu.mjs');
  }

  #initHandlers() {
    /* DEBUG */
    this.renHub.on('debug', ({data}) =>  this.rlog(data, 'warn'));
    this.renHub.on('loadDebugMenu', () => this.#loadDebugMenu());
    // Game Init listeners
    this.renHub.on('responseHtml', this.utilities.insertHtml);
    this.renHub.on('responseConfig', this.utilities.updateConfig);
    // HTML
    this.rendererHub.on('showElements', (...args) => this.frameControl.showElements(...args));
    this.rendererHub.on('hideElements', (...args) => this.frameControl.hideElements(...args));
    // Modal handler
    this.renHub.on('popupMessage', (...args) => this.#modalPassthrough(...args));
    // Server connection
    this.renHub.on('joinServer', this.lobby.joinServer);
    this.renHub.on('serverKick', (reason) => {
       this.rlog([`Kicked from server: ${reason}`]);
      window.Dune.session?.setServerStatus(false);
    });
    // Successful connect - save server settings & session state
    this.renHub.on('authSuccess', (playerData) => {
      const sessionState = window.Dune.session.state;
      if (sessionState === 'GAME') {
        //  this.rlog(`Attempting to restore GAME state...`);
        this.renHub.trigger('server/requestGameState');
      } else {
        //  this.rlog(`Attempting to restore LOBBY state...`);
        this.renHub.trigger('server/requestLobby', playerData);
      }
      window.Dune.session?.setServerStatus(true, playerData.setSessionToken);
    });  
    // Lobby
    this.renHub.on('responseLobbySetup', this.lobby.setupLobby);
    this.renHub.on('responseLobby', this.lobby.joinLobby);
    this.renHub.on('refreshLobby', this.lobby.updateLobby);
    /* *MAINMENU* this.renHub.on('initLobby', lobby.init); */
    this.renHub.on('cancelLobby', this.lobby.cancelLobby);
    this.renHub.on('lobbyError', (err) => {
      // TODO: This is where we need an error Modal - look at Modal Controller
       this.rlog(err, 'error');
    });
    this.renHub.on('coreLoadComplete', () => {
      this.renHub.trigger('main/coreLoadComplete');
      this.#coreLoadHandlers();
    });
  }

  #coreLoadHandlers() {
    // Game Setup

    // Game Updates
    this.renHub.on('updatePlayerList', this.utilities.updatePlayerList);
    // Mentat system
    this.renHub.on('mentatLoad', window.Dune?.mentat?.load);
    this.renHub.on('responseMentat', window.Dune?.mentat?.append);
  }

  // TODO: Add any validation or restrictions on modal types that can come through the event hub
  // Current: cannot be blocking, cannot disabled/blur main, default to 'alert'
  #modalPassthrough(data) {
    data.type = data.type ?? 'alert';
    data.disableMain = false;
    this.frameControl.createModal(data);
  }

  /* External handlers

    ./audio/audio.mjs
      this.renHub.on('playSound')
      this.renHub.on('playMusic')

    ./canvas/stageManager.mjs
      this.renHub.on('pixiSetupGameBoard')

    ./chat/chat.mjs
      this.renHub.on('chatMessage', getMessage);

  */
}