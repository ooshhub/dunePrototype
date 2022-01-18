import { slog, serverHub } from './serverHub.mjs';
import { Lobby } from './net/Lobby.mjs';

export const server = (() => {

	const Game = {};

	const linkServer = (gameServer) => Game.Server = gameServer;
	const checkHost = (pid) => Game.Server?.host?.pid === pid;

	// Grab the lobby on player join / initialise on host join
	const getLobby = async (playerData) => {
		if (playerData.isHost) {
			if (Game.Lobby) {
				slog(`Lobby already exists`, 'warn');
				// Prompt host to destroy old lobby
				Game.Lobby = null;
			}
			slog(`Host joined, initialising Lobby`);
			if (Game.Server.getServerState() !== 'INIT_LOBBY') return slog('Server was not ready for init lobby', 'error');
			Game.Lobby = new Lobby(Game.Server);
			let initData = await Game.Lobby.initLobbyData();
			slog([`Sending host lobby setup info`, initData]);
			serverHub.trigger('host/responseLobbySetup', initData);
		} else {
			slog(`Lobby request from ${playerData.pid}`);
			if (Game.Lobby.getLobbyState() !== 'OPEN') return slog(`getLobby Error: lobby is "${Game.Lobby.getLobbyState()}"`);
			let joinSuccess = await Game.Lobby.addPlayer(playerData);
			if (!joinSuccess) return slog([`${Game.Lobby.name}: Error adding player`, playerData], 'error');
			let lobbyData = await Game.Lobby.openLobbyData();
			serverHub.trigger('clients/lobbyUpdate', lobbyData);
		}
	}

	// Update the lobby on host action / player selection
	const updateLobby = ({ pid, type, data }) => {
		if (type === 'init' || type === 'options') {
			if (!checkHost(pid)) return slog(`Host check failed on "${pid}", aborting Lobby update`, 'warn');
			// Run some verification here
			// Game.Lobby = lobbyData;
			serverHub.trigger('clients/responseLobby', Game.Lobby);
		} else  {
			// do stuff
		}
	}

	return {
		linkServer,
		updateLobby, getLobby
	}

})();