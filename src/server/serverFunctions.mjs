import { serverHub, slog } from './serverHub.mjs';
import { Lobby } from './net/Lobby.mjs';

export const server = (() => {

	const createLobby = ({ name, host }) => {
		slog([`Creating new lobby: `, name, host], 'info');
		// Auto messaging
		serverHub.trigger('host/returnLobbyToHost', new Lobby(name, host));
	}

})();