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
			ingamemenu: 'dialog#ingamemenu',
			lobby: 'dialog#lobby'
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


	/**
	 * HTML / CSS / UI
	 */
	// Show / Hide / Fade one or more sections via selector strings
	const transitionSection = async (elements, direction, fadeTime=2000) => {
		if (!/^(in|out)$/.test(direction)) return rlog(`transitionSection() Error: bad direction input "${direction}"`, 'warn');
		elements = helpers.toArray(elements);
		await Promise.all(elements.map(async (el) => {
			if (!$(el)) return rlog(`showSection(): bad selector`, 'warn');
			let targetCSS = window.getComputedStyle($(el));
			let oldZ = parseInt(targetCSS.getPropertyValue('z-index')) || 0;
			rlog(oldZ);
			let newZ = (direction === 'in') ? 100 + oldZ : oldZ - 100;
			rlog(`newz ${newZ}`);
			if (direction === 'in') {
				$(el).classList.add('show');
				$(el).classList.remove('hide');
				$(el).style['z-index'] = newZ;
			}
			if (fadeTime > 0) await fadeSection(el, direction, fadeTime);
			if (direction === 'out') {
				$(el).classList.add('hide');
				$(el).classList.remove('show');
				$(el).style['z-index'] = newZ;
			}
		}));
		return 1;
	}
	const fadeSection = async (element, direction, length=2000) => {
		rlog(`Fading ${direction} ${element}...`);
		let target = $(element);
		if (!target || !/^(in|out)$/.test(direction)) return rlog(`fadeSection() error: bad selector or direction, "${element}", "${direction}"`);
		target.style.opacity = direction === 'out' ? 1 : 0;
		return new Promise(res => {
			let fade = setInterval(() => {
				if ((direction === 'out' && target.style.opacity <= 0) ||
						(direction === 'in' && target.style.opacity >= 1)) {
					clearInterval(fade);
					res();
				} else {
					if (direction === 'out') target.style.opacity = parseFloat(target.style.opacity) - 10/length;
					else target.style.opacity = parseFloat(target.style.opacity) + 10/length;
				}
			}, 10);
		});
	}
	

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

	const setupLobby = async (newLobby) => {
		if (window.Dune.Client.getClientState() === 'INIT_LOBBY') {
			rlog([`Received fresh Lobby for setup`, newLobby], 'info');
			renHub.trigger('main/requestHtml', { req: 'lobby', data: newLobby });
			let lobbyReady = await helpers.watchCondition(() => $('#lobby header'), 'Lobby HTML found', 6000);
			if (lobbyReady) {
				rlog('Lobby HTML detected, bringing window up...');
				await transitionSection(['dialog#lobby', 'main#chat'], 'in');
				transitionSection('dialog#loading-modal', 'out', 500);
			}
		} else rlog('Error in host Client state, not ready for Lobby setup', 'error');
	}

	return {
		insertHtml, updateConfig, updatePlayerList,
		transitionSection, fadeSection,
		joinLobby, setupLobby
	}
	
})();