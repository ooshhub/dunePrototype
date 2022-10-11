// the window.Dune object, holds a mix of data from CONFIG reference values, to live Pixi token data
// 

import { Helpers } from '../shared/Helpers.mjs';
import { Serialiser } from '../shared/Serialiser.mjs';

export class DuneStore {

  // Permanent features of the DuneStore
  #pid = null;
  #hid = null;
  #houses = {};
  #players = {};
  #map = null;
  #board = {};
  #tray = {};
  #session = null;
  #config = null;
  #eventHub = null;
  #client = null;
  #logger = () => {};

  constructor(storeConfig = {}) {
    Object.assign(this, {
      name: storeConfig.name || 'DuneStore',
    });
  }

  // Probably only exposed for debug. Try not to reference this in other code.
  //TODO: move client to private method, is referenced a lot
  layers = {};
  lobby = {};
  // helpers = Helpers;

  get pid() { this.#pid = this.#config?.userSettings?.player?.pid || ''; return this.#pid }
  get hid() { return this.#hid }
  get currentPlayer() { return (this.pid && this.#players) ? this.#players[this.pid] : null }
  get currentHouse() { return (this.#hid && this.#houses) ? this.#houses[this.#hid] : null }
  get houses() { return this.#houses } // Probably do something here with some ID replacing or some shit for ease of reading logs
  get players() { return this.#players } // Same again?
  get board() { return this.#board }
  get tray() { return this.#tray }
  get config() { return this.#config } // Has no methods on it, and no setter. Reference values only.
  get session() { return this.#session } // Access through class methods
  get renHub() { return this.#eventHub }	// Access through class methods
  get client() { return this.#client }
  get map() { return this.#map }

  // Setters only work once to initialise object
  set config(data) { this.#config = (this.#config === null && data.PATH) ? data : this.#config }
  set session(newSession) { this.#session = (this.#session === null && newSession.constructor?.name === 'SessionState') ? newSession : this.#session }
  set renHub(newHub) { this.#eventHub = (this.#eventHub === null && newHub.constructor.name === 'EventHub') ? newHub : this.#eventHub }
  set client(newSocket) { this.#client = (this.#client === null && newSocket?.constructor?.name === 'SocketClient') ? newSocket : this.#client }
  set map(mapData) { this.#map = (this.#map === null && mapData.id) ? mapData : this.#map }
  set logger(logFunction) { this.#logger = typeof(logFunction) === 'function' ? logFunction : console.log }
  
  // Serialiser data
  get appendFields() { return { _tray: this.#tray, _houses: this.#houses, _players: this.#players, _session: this.#session, _config: this.#config, _eventHub: this.#eventHub } }
  get blockFields() { return [] }

  rx = {
    uid: /-[A-Za-z0-9_-]{19}/,
    pid: /[A-Za-z]_[A-Za-z0-9_-]{18}/,
    hid: /[A-Za-z]{2}_[A-Za-z0-9_-]{17}/
  }

  // Updates for dynamic game data
  // TODO: add validation to each data type
  #updateHouses(data) {
    for (const house in data) {
      this.#houses[house] = this.#houses[house] ?? {};
      Object.assign(this.#houses[house], data[house]) }
    this.log(`${this.name}: updated Houses`);
  }
  #updatePlayers(data) {
    for (const player in data) {
      this.#players[player] = this.#players[player] ?? {};
      Object.assign(this.#players[player], data[player]);
    }
    this.log(`${this.name}: updated Players`);
  }
  #updateBoard(data) {
    Object.assign(this.#board, data);
    this.log(`${this.name}: updated Board`);
  }
  #updateTray(data) {
    this.#tray = data;
    this.log(`${this.name}: updated Tray`);
  }

  // Exposed update path
  update(targetProperty, data={}) {
    if (!this.#hid && data?.hid) this.#hid = data.hid;
    // this.log([`DuneStore update: ${targetProperty}`, data]);
    const targetArray = targetProperty === 'all' ? Object.keys(data) : Helpers.toArray(targetProperty);
    targetArray.forEach(target => {
      const dataRef = data[target] ?? data;
      switch(target) {
        case "houses":
          this.#updateHouses(dataRef);
          break;
        case "players":
          this.#updatePlayers(dataRef);
          break;
        case "board":
          this.#updateBoard(dataRef);
          break;
        case "tray":
          this.#updateTray(dataRef);
          break;
        case "map":
          this.#map = dataRef;
          break;
        default: 
          // console.warn(`${this.name}: Unrecognised update property/data write attempt: ${target}`);
      }
    });
  }

  // Get Player from pid, hid, playername or housename (attempt in that order)
  getPlayer(stringSearch) {
    if (typeof(stringSearch) !== 'string') return console.error(`getPlayer() requires one string parameter.`);
    if (this.rx.pid.test(stringSearch)) return this.players[stringSearch] ?? null;
    else if (this.rx.hid.test(stringSearch)) return this.players[(this.houses[stringSearch].pid||this.houses[stringSearch].lastPlayer)] ?? null;
    else {
      const playerData = Object.values(this.players);
      let stringResult = playerData.find(p => p.playerName.toLowerCase() === stringSearch.trim().toLowerCase());
      if (!stringResult) {
        const findHouse = Object.values(this.houses).find(h => h.name === Helpers.camelise(stringSearch));
        stringResult = findHouse ? this.players[(findHouse.pid||findHouse.lastPlayer)] : null;
      }
      return stringResult;
    }
  }

  // Get House from hid, pid, housename or playername (attempt in that order)
  getHouse(stringSearch) {
    if (typeof(stringSearch) !== 'string') return console.error(`getHouse() requires one string parameter.`);
    if (this.rx.hid.test(stringSearch)) return this.houses[stringSearch] ?? null;
    else if (this.rx.pid.test(stringSearch)) return Object.values(this.houses).find(house => (house.pid||house.lastPlayer) === stringSearch);
    else {
      const houseData = Object.values(this.houses);
      let stringResult = houseData.find(house => house.name === Helpers.camelise(stringSearch));
      if (!stringResult) {
        const findPlayer = Object.values(this.players).find(p => p.playerName.toLowerCase() === stringSearch.trim().toLowerCase());
        stringResult = findPlayer ? houseData.find(house => (house.pid||house.lastPlayer) === findPlayer.pid) : null;
      }
      return stringResult;
    }
  }

  async destroyClient() { this.#client = null }

  log(...args) { this.#logger(...args) }

  list() {
    const list = Serialiser.serialise(this);
    console.info(list);
  }

}