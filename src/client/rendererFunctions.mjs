import { rlog } from './rendererHub.mjs';
import { SocketClient } from './net/SocketClient.mjs';
import { renHub } from './rendererHub.mjs';
import { helpers } from '../shared/helpers.mjs';

export const ren = (() => {
	const $ = (selector) => window.document.querySelector(selector);
	/*
	// HTML & CONFIG REQUEST
	*/
	// Insert rendered HTML to game view
	const insertHtml = async (data) => {
		const targetSelector = {
			canvas: 'main#gamecanvas',
			ui: 'main#gameui',
			chat: 'main#chat',
			mainmenu: 'main#mainmenu',
			ingamemenu: 'dialog#ingamemenu'
		}
		if (data.html && targetSelector[data.req]) $(targetSelector[data.req]).innerHTML = data.html;
		else rlog(data.err||`HTML request error: "${data.req}" not found.`, 'error');
	};

	// Update CONFIG in browser window
	const updateConfig = ({ CONFIG }) => {
		rlog([`Received game data: `, CONFIG]);
		window.Dune.CONFIG = CONFIG;
	}
	const updatePlayerList = (playerData) => window.Dune.Players = playerData;

	/*
	// LOBBY AND GAME START
	*/
	const joinLobby = async (joinOptions) => {
		rlog(joinOptions);
		if (window.Dune.Client?.io) {
			rlog(`Closing old Client...`);
			window.Dune.Client.close()
			window.Dune.Client = null;
			await helpers.timeout(200);
		}
		const DuneClient = new SocketClient(joinOptions);
		window.Dune.Client = DuneClient;
		DuneClient.registerEventHub(renHub);
		rlog([`Created socket Client`, DuneClient]);
		let connected = await DuneClient.connectToGame();
		if (!connected) rlog(['Connection to server failed', joinOptions], 'warn');
	}

	const setupLobby = (newLobby) => {
		if (window.Dune.Client.getClientState() === 'INIT_LOBBY') {
			rlog([`Received fresh Lobby for setup`, newLobby], 'info');
			// Update UI with Lobby window
		} else rlog('Error in host Client state, not ready for Lobby setup', 'error');
	}

	return {
		insertHtml, updateConfig, updatePlayerList,
		joinLobby, setupLobby
	}
	
})();