import { slog, serverHub } from './serverHub.mjs';
import { Lobby } from './net/Lobby.mjs';
import { DuneCore } from './core/DuneCore.mjs';
import { Serialiser } from '../shared/Serialiser.mjs';
import { ClientPoll } from './net/ResponsePoll.mjs';
import { Helpers } from '../shared/Helpers.mjs';

// Alpha: move most of this to ServerInterface class. Lobby can probably get its own interface.

export const server = (() => {

  const Game = {};

  const linkServer = (gameServer) => Game.Server = gameServer;
  const checkHost = (pid) => Game.Server?.host?.pid === pid;

  /* DEBUG */
  const fetchCore = (data) => {
    slog('Fetching Core')
    const { pid } = data;
    if (pid && Game.Core) {
      const core = Serialiser.serialise(Game.Core);
      serverHub.trigger('client/debug', { targets: [pid], data: core });
    } else slog(`Error fetching core, no pid or no core: "${pid}"`);
  }


  /**
   * LOBBY FUNCTIONS
   */
  // Grab the lobby on player join / initialise on host join
  const getLobby = async (playerData) => {
    // If refresh only, send back refresh data
    if (playerData?.refresh) {
      let lobbyData = await Game.Lobby.getLobby();
      lobbyData.targets = playerData.pid;
      serverHub.trigger('client/responseLobby', lobbyData);
      return;
    }
    const { pid, reconnect } = playerData;
    // slog(`Getting lobby data... ${pid}, recon: ${reconnect}`);
    if (checkHost(pid)) {
      if (Game.Lobby) {
        if (reconnect) {
          serverHub.trigger('host/responseLobby', Game.Lobby.getLobby());
          return;
        } else {
          slog(`Lobby already exists`, 'warn');
          Game.Lobby = null;
        }
      }
      // slog(`Host joined, initialising Lobby`);
      if (Game.Server.getServerState() !== 'INIT_LOBBY') return slog(`Server was not ready for init lobby `, 'error');
      Game.Lobby = new Lobby(Game.Server);
      const initData = await Game.Lobby.initLobbyData();
      // slog([`Sending host lobby setup info`, initData]);
      serverHub.trigger('host/responseLobbySetup', initData);
    } else {
      // slog(`Lobby request from ${playerData.pid}`);
      if (Game.Lobby?.getLobbyState() !== 'OPEN') return slog(`getLobby Error: lobby is "${Game.Lobby.getLobbyState()}"`);
      const lobbyData = await Game.Lobby.playerJoin(playerData);
      if (lobbyData.stack) {
        return slog(lobbyData, 'error');
      }
      // lobbyData.targets = [pid];
      serverHub.trigger('clients/responseLobby', lobbyData);
    } 
  }

  const initLobby = async ({ pid, ruleset, players }) => {
    if (!checkHost(pid)) return slog(`Received Lobby data from non-host`, 'warn');
    // slog(`Received data: ${ruleset} and ${players}, initialising lobby.`);
    let lobbySetup = await Game.Lobby.setupLobby(ruleset, players);
    if (lobbySetup.stack) {
      slog(['Error setting up lobby:', lobbySetup], 'error');
      // Deal with error - close server, return to menu, show error modal
    } else {
      // slog('Sending lobby data back to host');
      serverHub.trigger('host/responseLobby', lobbySetup);
    }
  }

  const openLobby = () => Game.Lobby?.openLobby();

  // Update the lobby on host action / player selection
  const updateLobby = ({ pid, type, data }) => { 
    // slog([`Lobby update received`, data, type, pid]);
    if (!type || !pid || !data) return;
    let update = Game.Lobby.updateLobby(type, data, pid);
    if (!update || update.stack) slog(update, 'error');
    else serverHub.trigger('clients/refreshLobby', update);
  }

  const exitLobby = ({ pid }) => {
    if (checkHost(pid)) {
      // slog('Host destroyed lobby', 'warn');
      Game.Server?.destroy?.();
    }	else {
      // slog('Player left...');
      Game.Server.removePlayer(pid, 'Player quit lobby');
      Game.Lobby.playerQuit(pid);
    }
  }

  const submitLobby = ({ pid }) => {
    if (checkHost(pid)) {
      const lobbyReady = Game.Lobby.validateLobby();
      if (lobbyReady.stack) {
        // slog(lobbyReady);
        slog(['Lobby failed Validation', lobbyReady.message], 'warn');
        serverHub.trigger(`host/lobbyError`, lobbyReady);
      } else if (lobbyReady) {
        initialiseGameState();
      } else {
        slog(`Something went wrong`, 'error');
      }
    }
  }

  /**
   * GAME FUNCTIONS
   */
  const initialiseGameState = async () => {
    // slog(`Generating new Dune Campaign...`);
    const gameSeed = Game.Lobby.generateGameSeed();
    slog([`Gameseed: `, gameSeed], 'info');
    Game.Core = new DuneCore(gameSeed);
    const CoreClone = Serialiser.serialise(Game.Core);
    slog(CoreClone);
    if (Game.Core.stack) {
      slog([`Error creating game!`, Game.Core], 'error');
      // There was an error creating Game State, inform Host
      // Set Lobby state back to open/full
    } else if (Game.Core.state === 'INIT') {
      // Notify all clients to load canvas
      // Await ack from clients maybe ???
      // On success, destroy Lobby
      // Ack from clients on successful load ??? or just tie into player connection_error functionality
      // When all players ACK, Core sets state to READY
      slog(`Successfully created new Dune Game from seed, state: ${Game.Core.state}`, 'info');
      const houseErrors = await Game.Server.createHouseList(Game.Core.houseList);
      if (houseErrors > 0) slog(`Server failed to create houseList`, 'error');
			const playersReady = await new ClientPoll({
				name: 'initGameBoard',
				targets: Game.Core.hidList,
				poll: getGameState(Game.Core.hidList),
				ack: { name: 'initGameBoardReady' }
			}).send();
			// const playersReady = await playersReadyPoll.send();
			slog(playersReady);
			if (playersReady.res) Game.Core.update('playersReady', {});
    }
  }

	const getGameState = (houseIds) => {
		houseIds = Helpers.toArray(houseIds);
    if (Game.Core.state) {
      const gameData = {
        players: Game.Server.getPlayerList(),
        board: Game.Core.boardState,
        houses: Game.Core.houseList,
        trays: Game.Core.trayContents,
        map: Game.Core.map,
      };
			if (houseIds.length) {
				return houseIds.map(house => {
					if (!gameData.houses[house]) slog(`Bad target in gameState request: ${house}`);
					else return { hid: house, map: gameData.map, board: gameData.board, players: gameData.players, houses: gameData.houses, tray: gameData.trays[house], targets: house };
				});
			} else return gameData;
		} else return new Error(`Game Core is not ready.`);
	}

  const sendGameState = (houseIds) => {
		const targets = houseIds ? Helpers.toArray(houseIds) : Game.Core.hidList;
		const gameData = getGameState(targets);
		gameData.forEach(state => serverHub.trigger('client/initGameBoard', state));
  }

  return {
    fetchCore, //DEBUG LINE
    linkServer,
    initLobby, updateLobby, getLobby, openLobby, exitLobby, submitLobby,
    sendGameState,
  }

})();