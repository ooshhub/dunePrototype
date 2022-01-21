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
			canvas: { selector: 'main#gamecanvas'},
			ui: { selector: 'main#gameui'},
			chat: { selector: 'main#chat'},
			mainmenu: { selector: 'main#mainmenu'},
			ingamemenu: { selector: 'dialog#ingamemenu'},
			lobby: { selector: 'dialog#lobby', eventTrigger: 'initLobby' },
		}
		if (data.html && targetSelector[data.req].selector) $(targetSelector[data.req].selector).innerHTML = data.html;
		else rlog(data.err||`HTML request error: "${data.req}" not found.`, 'error');
		if (targetSelector[data.req].eventTrigger) renHub.trigger(targetSelector[data.req].eventTrigger, data);
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
	const transitionSection = async (elements, direction, fadeTime=1000) => {
		if (!/^(in|out)$/.test(direction)) return rlog(`transitionSection() Error: bad direction input "${direction}"`, 'warn');
		elements = helpers.toArray(elements);
		await Promise.all(elements.map(async (el) => {
			if (!$(el)) return rlog(`showSection(): bad selector`, 'warn');
			let targetCSS = window.getComputedStyle($(el));
			let oldZ = parseInt(targetCSS.getPropertyValue('z-index')) || 0;
			// rlog(oldZ);
			let newZ = (direction === 'in') ? 100 + oldZ : oldZ - 100;
			// rlog(`newz ${newZ}`);
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
	const fadeSection = async (element, direction, length=1000, timeStep = 2) => {
		rlog(`Fading ${direction} ${element}...`);
		let start = Date.now();
		let target = $(element);
		if (!target || !/^(in|out)$/.test(direction)) return rlog(`fadeSection() error: bad selector or direction, "${element}", "${direction}"`);
		// target.style.opacity = direction === 'out' ? 1 : 0;
		return new Promise(res => {
			let fade = setInterval(() => {
				if ((direction === 'out' && target.style.opacity <= 0) ||
						(direction === 'in' && target.style.opacity >= 1)) {
					clearInterval(fade);
					res();
				} else {
					let elapsed = Date.now() - start;
					// rlog([elapsed, length, elapsed/length, target.style.opacity]);
					if (direction === 'out') target.style.opacity = 1 - elapsed/length;
					else target.style.opacity = elapsed/length;
				}
			}, timeStep);
		});
	}
	

	/*
	// LOBBY AND GAME START
	*/
	const joinServer = async (joinOptions) => {
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
				transitionSection(['dialog#lobby', 'main#chat'], 'in', 500);
				transitionSection('dialog#loading-modal', 'out', 250);
			}
		} else rlog('Error in host Client state, not ready for Lobby setup', 'error');
	}

	const joinLobby = async ({ lobbyData, playerData }) => {
		rlog([`Received lobby data:`, lobbyData], 'info');
		// Validate data
		renHub.trigger('main/requestHtml', { req: 'lobby', data: lobbyData });
		if (await helpers.watchCondition(() => $('.player-list'))) {
			renHub.trigger('updateLobby', { playerData: playerData });
			window.Dune.Client?.inLobby();
			window.Dune.Session?.update('LOBBY');
			renHub.trigger('server/hostJoined', { });
		} else {
			rlog(`Lobby failed to load`);
			// close lobby & shit
		}
	}

	const updateLobby = async ({ serverOptions, playerData }) => {
		if (!serverOptions && !playerData) return rlog(`Bad lobby update received: no data`);
		if (serverOptions) {
			rlog([`Lobby update received`, serverOptions]);
		}
		if (playerData) {
			rlog([`Lobby update received`, playerData]);
			Object.keys(playerData).forEach(p => {
				let targetRow = $(`.player[data-index="${p}"]`);
				rlog(`Inserting player into slot ${p}`);
				targetRow.querySelector('.player-name span').innerText = playerData[p].playerName;
				targetRow.dataset.id = playerData[p].pid;
				targetRow.dataset.ishost = (p == 1) ? '1' : '';
			});
		}
	}

	const cancelLobby = async () => {
		renHub.trigger('server/killLobby');
		destroyClient();
		// do more stuff
	}

	const destroyClient = async () => {
		window.Dune.Client?.destroy?.(); // doesnt exist yet
		window.Dune.Client = null;
		window.Dune.Session?.update('MENU');
	}

	return {
		insertHtml, updateConfig, updatePlayerList,
		transitionSection, fadeSection,
		joinServer, joinLobby, setupLobby, updateLobby, cancelLobby
	}
	
})();