// core game state maintained by server
import { HouseList } from "./services/HouseService.mjs";
import { RoundController } from "./RoundController.mjs";
import { CardDeckController } from "./CardDeckController.mjs";
import { DuneMap } from "./controllers/DuneMapController.mjs";
import { serverHub, slog } from "../serverHub.mjs";
import { Helpers } from "../../shared/Helpers.mjs";
import { Serialiser } from "../../shared/Serialiser.mjs";
import { ClientPoll } from "../net/ResponsePoll.mjs";

export class DuneCore {

  #state = '';
  #validCoreStates = { INIT: 'INIT', READY: 'READY', BUSY: 'BUSY', AWAIT_PLAYER: 'AWAIT_HOUSE', ERROR: 'ERROR', PLAYER_DISCONNECT: 'PLAYER_DISCONNECT' };

  #rulesetName = '';
  #validator = {}; // Validate PlayerTurn on submission
  #turnLimit = 10;

  #houses = {};
  // #playerList = {}; // Core should only interact with Houses, not directly with Players

  #duneMap = {};

  #stormPosition = 0;
  #board = {}; // Store status of all tokens on the map
  #tanks = {}; // Store status of all tokens in Tleilaxu Tanks
  #trays = {}; // Store status of all tokens in player trays/hands.

  #cards = {}; // Store status of all card decks & cards

  #turnCounter = 0;
  #roundController = {};
  #houseTurnOrder = [];

  constructor(seed) {
    this.#setState('INIT');
    this.#houses = new HouseList(seed.playerList, seed.ruleset);
    this.#roundController = new RoundController(seed.ruleset, this.houseList, this);
    this.#cards = new CardDeckController(seed.ruleset.decks, seed.serverOptions);
    this.#turnLimit = seed.turnLimit > 0 ? seed.turnLimit : 15;
    this.#duneMap = new DuneMap();
    this.#rulesetName = seed.name;
    this.name = seed.name || 'New Dune Game';
    this.host = seed.host;
    this.#initBoardAndTrays();
  }

  get appendFields() { return { _rulesetName: this.#rulesetName, _roundController: this.#roundController, _houses: this.#houses, _duneMap: this.#duneMap, _board: this.#board, _tanks: this.#tanks, _trays: this.#trays, _cards: this.#cards } }

  get nextHouse() { return this.#houseTurnOrder.shift() }

  #initBoardAndTrays() {
    // Setup regions on Board from duneMap region data.
    this.#duneMap.regionList.forEach(r => {
      this.#board[r] = {
        regionData: this.#duneMap.regions[r],
        armies: {},
        spice: 0,
        stormAffected: this.#duneMap.regions[r].terrain?.includes('sand') ? true : false,
        stormBlocked: false,
      }
    });
    // Set up each House
    for (const house in this.#houses) {
      // slog(`Setting up ${house}...`);
      const setup = this.#houses[house].stats;
      // Add tokens to map region
      // TODO: deal with Fremen token placement choice as a "turn 0" before proper game start
      const placedTokens = Object.entries(setup.startingPosition.placed) ?? [];
      let startSoldiers = setup.soldiers || 20;
      placedTokens.forEach(p => {
        if (this.#duneMap.isRegion(p[0])) {
          // Might need to do another turn 0 to deal with elite troop placement?
          const placedSoldiers = p[1];
          // TODO: Create Army class to hold soldiers, sector placement etc, with getter for total strength
          this.#board[p[0]].armies[house] = { soldiers: placedSoldiers, eliteSoldiers: 0, sector: this.#board[p[0]].stormSectors?.[0]??-1 }
          startSoldiers -= placedSoldiers;
        }
      });
      // Set up tray
      this.#trays[house] = { soldiers: 0, elites: 0, spice: 0, leaders: [] };
      // Add other tokens to house tray
      let tokenArray = [
        { type: 'soldiers', quantity: startSoldiers },
        { type: 'elites', quantity: setup.eliteSoldiers ?? 0 },
        { type: 'spice', quantity: setup.startingSpice }
      ];
      this.#houses[house].leaders.forEach(leader => {
        tokenArray.push({
          type: 'leaders',
          quantity: 1,
          data: leader
        });
      });
      // slog([`Sending array to house tray:`, tokenArray]);
      this.#modifyTray(house, tokenArray);
    }
    // slog([`Finished setting up trays`, this.#trays]);
  }

  async #resolveTask(component, taskName, task) {
    let taskOutput = { name: taskName, data: null };
    slog([`Resolving task: ${taskName}...`, task]);
    switch(component) {
      case `action`: {
        taskOutput.result = await task.action();
        break;
      }
      case `roundController`: {
        this.#roundController.resolveTask(taskName, task);
        break;
      }
      case `core`: {
        switch(taskName) {
          case `awaitCardOpportunity`: {
            const cardsPlayed = await this.#cardOpportunity(task.actionTags);
            slog([`Received cardOpportunity results: `, cardsPlayed]);
            // Send to Card Effect Resolver
            // Send Resolver results back to clients
            break;
          }
          case `stormMovement`: {
            const stormDamage = this.#doStormMovement();
            taskOutput.data = stormDamage;
            break;
          }
          case `determineTurnOrder`: {
            this.#houseTurnOrder = this.#roundController.newTurnOrder;
            break;
          }
        }
      }
    }
    return taskOutput.data ? taskOutput : null;
  }

  async #processRoundTasks(taskArray) {
    let outputAll = [];
    for (let i = 0; i < taskArray.length; i++) {
      const taskParts = taskArray[i].actionId.split(/\s*\/\s*/);
      const taskResult = await this.#resolveTask(taskParts[0]||'', taskParts[1]||'', taskArray[i]);
      outputAll.push(taskResult);
    }
    return outputAll.filter(v=>v);
  }

  // Give players an opportunity to play a card, with timeout
  // TODO: client side 'cardOpportunity' event doesn't exist
  async #cardOpportunity(tags) {
    const playerCardOp = new ClientPoll({
      name: `cardOpportunity`,
      uniqueMessages: false,
      targets: this.hidList,
      poll: { tags: Helpers.toArray(tags) },
      ack: { name: 'cardResponse', responseType: 'object' },
      timeout: 10000
    });
    const responses = await playerCardOp.send();
    return responses;
  }

  #doStormMovement() {
    // Check if Storm Control is in effect???
    const movement = Helpers.randomInt(12),
      affectedSectors = Array(movement).fill().map((v,i) => (this.#stormPosition + i + 1) % this.#duneMap.stormSectors);
    this.#stormPosition = affectedSectors[movement-1];
    const tokensLost = this.#resolveStormEffects(affectedSectors);
    return tokensLost;
  }

  #resolveStormEffects(sectorArray) {
    const tokensLost = { armies: {}, spice: 0 }
    sectorArray.forEach(sector => {
      for (const region in this.#board) {
        if (this.#board[region].stormAffected && this.#board[region].stormSectors.includes(sector)) {
          if (this.#board[region].spice) {
            tokensLost.spice = this.#board[region].spice;
            this.#board[region].spice = 0;
          }
          for (const house in this.#board[region].armies) {
            const army = this.#board[region].armies[house];
            // TODO: Check army.strength > 0 here, once Army class is done
            if (sectorArray.includes(house.sector)) {
              tokensLost.armies[house] = {
                soldiers: army.soldiers,
                eliteSoldiers: army.eliteSoldiers,
              }
              // TODO: replace with Army methods to kill soldiers
              army.soldiers = 0;
              army.eliteSoldiers = 0;
            }
          }
        }
      }
    });
    tokensLost.damage = (tokensLost.spice || Object.keys(tokensLost.armies)?.length) ? true : false;
    return tokensLost;
  }

  #setState(newState) { this.#state = this.#validCoreStates[newState] ?? this.#state;	slog(`Core state set to "${this.state}"`); }
  get state() { return this.#state }

  isHouse(hid) { return this.#houses[hid] ? true : false }

  // add to a house tray, hid: houseId, { type: solder/leader/etc, quantity: 1 }
  #modifyTray(hid, tokenArray) {
    if (!this.#trays[hid]) return slog(`coreError: house ${hid} does not exist`, 'error');
    tokenArray = Helpers.toArray(tokenArray);
    tokenArray.forEach(tok => {
      if (this.#trays[hid][tok.type] != null && tok.quantity > -1) {
        if (tok.type === 'leaders') {
          if (tok.quantity > 0) this.#trays[hid].leaders.push(tok.data);
          else {
            const idx = this.#trays.leaders.findIndex(ldr => ldr.id === tok.data.id);
            this.#trays.leaders.splice(idx, 1);
          }
        } else {
          this.#trays[hid][tok.type] += tok.quantity;
        }
      } else slog([`trayError: bad token input`, tok]);
    });
  }

  get hidList() { return Object.keys(this.#houses.list) }

  get houseList() { return this.#houses.list }

  get boardState() { return this.#board }

  get trayContents() { return this.#trays }

  get map() { return Serialiser.serialise(this.#duneMap) }

  async update(updateType, data) {
    const outputData = { clients: [], otherData: [] };
    switch(updateType) {
      case 'playersReady': {
        // Turn 0 for troop placement, prediction etc.
        this.#setState('BUSY');
        this.#turnCounter = 1;
        this.#roundController.next(0);
        break;
      }
      case 'endRound': {
        slog([`End of round task list received by core`, data]);
        const clientData = await this.#processRoundTasks(data);
        outputData.clients.push({ name: 'startRound', data: clientData });
        break;
      }
      case 'startRound': {
        slog([`Start of round task list received by core`, data]);
        const clientData = await this.#processRoundTasks(data);
        outputData.clients.push({ name: 'startRound', data: clientData });
        break;
      }
      case 'playerTurn': {
        slog(['Turn submission received from player', data]);
        // validate turn
        // this.#playerTurn.shift()
        // if this.#playerTurn.length, await next player
        break;
      }
      default:
        slog(`Unknown Core update: ${updateType}`, 'warn');
    }
    if (outputData.clients.length) {
      outputData.clients.forEach(msg => {
        serverHub.trigger(`clients/${msg.name}`, msg.data);
      });
    }
    slog([`Finished Core update: `, outputData]);
    return outputData.otherData;
  }

  get listAll() {
    return {
      name: this.name,
      ruleset: this.#rulesetName,
      map: this.#duneMap.list,
      round: this.#roundController.list,
      houses: this.#houses.list,
      cards: this.#cards.list,
    }
  }

}