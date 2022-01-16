import { slog, serverHub } from './serverHub.mjs';
import { Lobby } from './net/Lobby.mjs';

export const server = (() => {

	const Game = {};

	const linkServer = (gameServer) => Game.Server = gameServer;
	const checkHost = (pid) => Game.Server?.host?.pid === pid;

	const updateLobby = ({ pid, lobbyData }) => {
		if (checkHost(pid)) {
			// Run some verification here
			Game.Lobby = lobbyData;
			serverHub.trigger('clients/responseLobby', Game.Lobby);
		} else slog(`Host check failed on "${pid}", aborting Lobby update`, 'warn');
	}

	const getLobby = async ({ isHost, pid }) => {
		if (isHost) {
			if (Game.Lobby) {
				slog(`Lobby already exists`, 'warn');
				// Prompt host to destroy old lobby
				Game.Lobby = null;
			}
			slog(`Host joined, initialising Lobby`);
			if (Game.Server.getServerState() !== 'INIT_LOBBY') return slog('Server was not ready for init lobby', 'error');
			Game.Lobby = new Lobby(Game.Server);
			Game.Lobby.rulesetList = await Game.Lobby.getRulesetList();
			serverHub.trigger('host/responseLobbySetup', Game.Lobby);
		} else {
			slog(`Lobby request from ${pid}`);
			if (Game.Lobby.getLobbyState() !== 'OPEN') return slog(`getLobby Error: lobby is "${Game.Lobby.getLobbyState()}"`);
			let data = { lobby: Game.Lobby, targets: [pid] }
			serverHub.trigger('client/responseLobby', data)
		}
	}

	return {
		linkServer,
		updateLobby, getLobby
	}

})();