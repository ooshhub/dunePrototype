/* */
import { helpers } from '../../shared/helpers.mjs';

export class SessionState {

  #updated;
  #sessionId;
  #state;
  #store;

  #logger = console.log;

  #rootElement = null;
  #trackedElements = ['body main'];
  #rx = {
    shownElements: new RegExp(`fc-fade-in-\\w+`),
  };

  #validStates = {
    MENU: 'MENU',
    LOBBY: 'LOBBY',
    GAME: 'GAME',
    ERROR: 'ERROR',
    UNKNOWN: 'UNKNOWN',
    RESTORING: 'RESTORING'
  };

  // Change to sessionId later
  constructor(sessionData={}) {
    this.#updated = Date.now();
    this.#rootElement = sessionData.rootElement ?? window.document;
    if (!this.#rootElement) throw new Error(`${this.constructor.name}: Document not found.`);
    this.#store = {
      player: {},
      ui: {
        active: null, // Not needed??? State & hidden/shown should cover this.
        hidden: [], // not needed? evertyhing should be hidden, unless shown
        shown: [],
      },
      server: {
        url: null,
        path: '',
        password: '',
      },
      house: {},
    };
    helpers.bindAll(this);
    this.#logger = window.Dune?.rlog ?? this.#logger;
  }
  
  get state() { return this.#state }
  
  get store() { return { store: this.#store } }
  get interface() { return { hidden: this.#store.ui.hidden||[], shown: this.#store.ui.shown||[] } }
  get server() { return { server: this.#store.server } }
  get player() { return { player: this.#store.player } }

  #setSessionState(newState) { this.#state = this.#validStates[newState] ? newState : this.#state }

  async #updateInterfaceStatus() {
    if (!this.#rootElement) return this.#logger(`SessionState: failed to find Document`, 'error');
    const uiElements = Array.from(this.#rootElement.querySelectorAll(this.#trackedElements.join(', ')));
    this.#store.ui.shown = uiElements.reduce((collection, el) => {
      const shownClass = el.classList.value.match(this.#rx.shownElements);
      return shownClass ? collection.concat(`${el.tagName}#${el.id}|${shownClass[0]}`) : collection;
    }, []);
    // rlog(this.#store.ui);
  }
  async #updateServerStatus() {
    if (!window.Dune?.client?.player) return this.#logger(`SessionState: failed to find server info on SocketClient`, 'warn');
    Object.assign(this.#store.server, window.Dune.client.serverOptions);
  }
  async #updatePlayerStatus() {
    if (!window.Dune.currentPlayer) return this.#logger(`SessionState: failed to find player details`, 'warn');
    Object.assign(this.#store.player, window.Dune.currentPlayer);
    if (window.Dune.currentHouse) Object.assign(this.#store.house, window.Dune.currentHouse);
  }

  async #saveToStorage() {
    let payload = { state: this.state, store: this.#store };
    window.sessionStorage.setItem('DuneSession', JSON.stringify(payload));
    // rlog(`SessionState: session stored.`);
  }

  init(playerData) {
    this.#store.player = playerData;
    this.#setSessionState('MENU');
    this.#store.ui.shown.push('main#mainmenu');
  }

  async restore(previousSession) {
    this.#setSessionState('RESTORING');
    // rlog(['Restoring session...', previousSession]);
    const { state, store } = JSON.parse(previousSession);
    // Restore HID if found in previous session
    if (store.house?.hid) window.Dune.update(undefined, {hid: store.house.hid });
    if (state && store?.player?.pid) Object.assign(this.#store, JSON.parse(previousSession).store);
    let returnData = { state: state, store: store, reconnect: this.getServerReconnectObject() }
    this.#setSessionState(`${state}`);
    return returnData;
  }

  async update(state, component='all', save=true) {
    if (this.state === 'RESTORING') return;
    let queue = [];
    if (component === 'all' || component === 'ui') queue.push(this.#updateInterfaceStatus.bind(this));
    if (component === 'all' || component === 'server') queue.push(this.#updateServerStatus.bind(this));
    if (component === 'all' || component === 'player') queue.push(this.#updatePlayerStatus.bind(this));
    if (queue.length) {
      await Promise.all(queue.map(async (fn) => fn()));
      this.#updated = Date.now();
    }
    if (state) this.#setSessionState(state);
    if (save) this.#saveToStorage();
  }

  setServerStatus(connected, token) {
    if (connected) {
      this.#store.server.sessionToken = token;
      this.#store.reconnect = 1;
    } else {
      this.#store.server.sessionToken = null;
      this.#store.reconnect = 0;
    }
    this.update();
  }

  getServerReconnectObject() {
    let s = this.server,
        p = this.player,
        output = {};
    Object.assign(output, s.server, p.player);
    output.reconnect = this.#store.reconnect;
    return output;
  }
}