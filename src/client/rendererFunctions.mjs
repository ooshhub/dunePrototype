import { rlog } from './rendererHub.mjs';
import { SocketClient } from './net/SocketClient.mjs';
import { renHub } from './rendererHub.mjs';

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
	const updatePlayerList = (playerData) => window.CONFIG.Players = playerData;

	/*
	// LOBBY AND GAME START
	*/
	const joinLobby = async (joinOptions) => {
		rlog(joinOptions);
		const DuneClient = new SocketClient(joinOptions);
		window.Dune.Client = DuneClient;
		DuneClient.registerEventHub(renHub);
		rlog([`Created socket Client`, DuneClient]);
		let connected = await DuneClient.connectToGame();
		if (!connected) {
			rlog(['Connection to server failed', joinOptions], 'warn');
		} else {
			rlog('Connected to server, joining lobbby...');
			// Request Lobby info from server
		}
	}

	return {
		insertHtml, updateConfig, updatePlayerList,
		joinLobby
	}
	
})();