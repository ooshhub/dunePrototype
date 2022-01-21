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
			// slog([`Sending host lobby setup info`, initData]);
			serverHub.trigger('host/responseLobbySetup', initData);
		} else {
			// slog(`Lobby request from ${playerData.pid}`);
			if (Game.Lobby.getLobbyState() !== 'OPEN') return slog(`getLobby Error: lobby is "${Game.Lobby.getLobbyState()}"`);

		} 
	}

	const initLobby = async ({ pid, ruleset, players }) => {
		if (!checkHost(pid)) return slog(`Received Lobby data from non-host`, 'warn');
		slog(`Received data: ${ruleset} and ${players}, initialising lobby.`);
		let lobbySetup = await Game.Lobby.setupLobby(ruleset, players);
		if (lobbySetup.stack) {
			slog(['Error setting up lobby:', lobbySetup], 'error');
			// Deal with error - close server, return to menu, show error modal
		} else {
			slog('Sending lobby data back to host');
			serverHub.trigger('host/responseLobby', lobbySetup);
		}
	}

	const openLobby = () => Game.Lobby?.openLobby();

	// Update the lobby on host action / player selection
	const updateLobby = ({ pid, type, data }) => {
		slog([`Lobby updated received`,data]);
		if (!type || !pid) return;
		let update = updateLobby(type, data, pid);
		if (update) serverHub.trigger('clients/updateLobby', update);
	}

	return {
		linkServer,
		initLobby, updateLobby, getLobby, openLobby
	}

})();