// server event hub landing
import { EventHub } from '../shared/EventHub.mjs';
import { DebugLogger } from '../shared/DebugLogger.mjs';
import { server } from './serverFunctions.mjs';
import { handleChat } from './chat/chatHub.mjs';

const debug = 1;
export const serverHub = new EventHub('serverHub');
export const slog = new DebugLogger('server', serverHub, debug, 1, 'host');
const Game = {};

export const initServerHub = async (gameServer) => {

  Game.Server = gameServer;
  Game.Server.registerEventHub(serverHub);
  server.linkServer(Game.Server);

  if (serverHub.getHubState() === 'INIT') return slog(`Hub was already initialised.`);
  
  // Server ==> Client returns
  // Shortcut for sending to host
  serverHub.for('host', async (event, data, ...args) => {
    Object.assign(data, {targets: 'host'});
    Game.Server.sendToClient(event, data, args);
  });
  // Shortcut for sending to everyone but host
  serverHub.for('players', async (event, data, ...args) => {
    Object.assign(data, {targets: 'players'});
    Game.Server.sendToClient(event, data, args);
  });
  // Singular client expects at least one id
  serverHub.for('client', async (event, data, ...args) => {
    if (!data?.targets?.length) slog(`No target ids found on event sent to "client/"`, 'warn');
    Game.Server.sendToClient(event, data, ...args)
  });
  // Clients and renderer both emit to all clients
  serverHub.for('clients', Game.Server.sendToClient);
  // Force send to all clients - removes targets from message
  serverHub.for('allClients', (event, data, ...args) => {
    data.targets = null;
    Game.Server.sendToClient(event, data, ...args);
  });
  serverHub.for('renderer', Game.Server.sendToClient);

  /* DEBUG */
  serverHub.on('requestCore', server.fetchCore);


  // Setup server & lobby
  serverHub.on('requestLobby', server.getLobby);
  serverHub.on('setupLobby', server.initLobby);
  serverHub.on('hostJoined', () => {
    server.openLobby();
    Game.Server.hostJoinedLobby();
  });
  serverHub.on('updateLobby', (data) => {
    slog(data);
    server.updateLobby(data);
  });
  serverHub.on('sendLobbyUpdate', Game.Server.sendToClient);
  serverHub.on('exitLobby', server.exitLobby);
  serverHub.on('submitLobby', server.submitLobby);

  // Game State
  serverHub.on('requestGameState', ({ hid }) => {
    if (hid) server.sendGameState(hid);
    else slog(`Bad id in game state request: ${hid}`);
  });

  // Chat
  serverHub.on('postMessage', handleChat);

  slog(`===Server Hub online===`);
  
  serverHub.hubInitDone();
}