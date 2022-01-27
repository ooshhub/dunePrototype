import { slog, serverHub } from './serverHub.mjs';
import { Lobby } from './net/Lobby.mjs';

export const server = (() => {

	const Game = {};

	const linkServer = (gameServer) => Game.Server = gameServer;
	const checkHost = (pid) => Game.Server?.host?.pid === pid;

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
		slog(`Getting lobby data... ${pid}, recon: ${reconnect}`);
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
			slog(`Host joined, initialising Lobby`);
			if (Game.Server.getServerState() !== 'INIT_LOBBY') return slog(`Server was not ready for init lobby `, 'error');
			Game.Lobby = new Lobby(Game.Server);
			let initData = await Game.Lobby.initLobbyData();
			// slog([`Sending host lobby setup info`, initData]);
			serverHub.trigger('host/responseLobbySetup', initData);
		} else {
			// slog(`Lobby request from ${playerData.pid}`);
			if (Game.Lobby?.getLobbyState() !== 'OPEN') return slog(`getLobby Error: lobby is "${Game.Lobby.getLobbyState()}"`);
			let lobbyData = await Game.Lobby.playerJoin(playerData);
			if (lobbyData.stack) {
				return slog(lobbyData, 'error');
			}
			// lobbyData.targets = [pid];
			serverHub.trigger('clients/responseLobby', lobbyData);
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
		slog([`Lobby update received`, data, type, pid]);
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
			Game.Server.destroyPlayer(pid, 'Player quit lobby');
			Game.Lobby.playerQuit(pid);
		}
	}

	return {
		linkServer,
		initLobby, updateLobby, getLobby, openLobby, exitLobby,
	}

})();