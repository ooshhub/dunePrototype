// Main menu scripts
// import { helpers } from '../../shared/helpers.mjs';
import { rlog, renHub } from '../rendererHub.mjs';

const $$ = window.$$;
const $ = window.$;


export const initMainMenu = async () => {
	await window.Dune.Helpers.watchCondition(() => document.readyState);
	// Main menu buttons
	$$('button.expandable').forEach(b => b.addEventListener('click', menu.toggleMenuItem));
	$$('input.toggle').forEach(t => t.value = 0);
	$$('button.launch-lobby').forEach(b => b.onclick = menu.launchLobby);
	$('.modal-button').addEventListener('click', menu.modalDown);
	$('#menu-quit')?.addEventListener('click', () => renHub.trigger('main/exitGame'));

	// Fallback for unblurring main menu
	$('#mainmenu').addEventListener('click', (ev) => { if (ev.target.id === 'mainmenu') menu.blurMainMenu() });

	// Remove pid from index
	$('input[name="pid"]').tabIndex = -1;

	renHub.on('mainMenuModalDown', menu.modalDown);
	renHub.on('mainMenuModalUp', menu.modalUp);
	renHub.on('checkMenuBlur', menu.blurMainMenu);
	renHub.on('initLobby', lobby.init);


	// Changes to userSettings values.
	// Key is setting name is userSettings, value is path to the key
	const settingsKeys = {
		gameName: 'host',
		hostPort: 'host',
		playerName: 'player',
	};
	for (let input in settingsKeys) {
		$(`input[name="${input}"]`).addEventListener('change', (ev) => {
			renHub.trigger('main/writeConfig', { path: `userSettings/${settingsKeys[input]}`, data: {[input]: ev.target.value||'', options: { createPath: true } } });
			if (input === 'playerName') {
				let newId = window.Dune.Helpers.generatePlayerId(ev.target.value);
				if (newId) {
					renHub.trigger('main/writeConfig', { path: `userSettings/player`, data: { pid: newId } } );
					$(`input[name="pid"]`).value = newId;
				}
			}
		});
	}
	// renHub.trigger('main/mainMenuLoaded')
	return 1;
}

const lobby = (() => {

	const formTags = ['input', 'select']

	const init = () => {
		// Set up buttons
		$(`#cancel-lobby`)?.addEventListener('click', cancel);
		$(`#create-lobby`)?.addEventListener('click', create);
		$(`#submit-lobby`)?.addEventListener('click', submit);
		$$(`${formTags.map(tag => `.player-list ${tag}`).join(', ')}`)?.forEach(el => el.addEventListener('change', (ev) => {
			update(ev, 'player');
		}));
		if (window.Dune.ActivePlayer?.isHost && $('.server-options')) {
			$$(`${formTags.map(tag => `.server-options ${tag}`).join(', ')}`)?.forEach(el => el.addEventListener('change', (ev) => {
				update(ev, '');
			}));
			$('.server-options').classList.remove('disabled');
		}
		$('#copy-server-link').addEventListener('click', copyServerLink);
		$('#refresh-lobby').addEventListener('click', refresh);
	}	

	const getFormData = (selector, tags = formTags) => {
		let inputs = $(`${selector}`).querySelectorAll(`${tags.join(', ')}`);
		let output = {};
		inputs.forEach(input => {
			output[input.name||'unknown'] = input.value;
		});
		return output;
	}

	const cancel = async () => {
		renHub.trigger('cancelLobby'); // TODO:no Handler yet
		renHub.trigger('fadeElement', '#lobby', 'out', 1000);
		menu.modalDown(true);
	}

	const create = () => {
		let data = getFormData('.init');
		rlog([`Sending back Lobby data:`, data]);
		renHub.trigger('server/setupLobby', data);
	}

	const update = (ev) => {
		let elName = ev.target.attributes?.name?.value;
		if (!elName) return rlog(`Bad input name: ${ev.target}`, 'warn');
		let pIdx = parseInt(elName.replace(/\D/g, '')),
				key = elName.replace(/[\d-]/g, '');
		if (!pIdx) return rlog([`Couldn't find player index in changed setting!`, ev], 'warn');
		rlog(`Send update to server: player ${pIdx}: ${key}/${ev.target.value}`);
		let update = {
			index: pIdx,
			name: key,
			value: ev.target.value
		}
		renHub.trigger('server/updateLobby', { type: 'updatePlayer', data: update });
		// Load mentat data
		if (key === 'house') {
			let mentatLink = ev.target.querySelector('option:checked')?.dataset.mentat;
			rlog(`Found mentat link: ${mentatLink}`);
			renHub.trigger('mentatLoad', { target: 'lobby', data: mentatLink });
		}
	}

	const copyServerLink = () => renHub.trigger('main/writeClipboard', window.Dune.Client?.serverOptions?.hostUrl);

	const refresh = () => renHub.trigger('server/requestLobby', {refresh: true});

	const submit = () => {
		rlog(`submit lobby`);
	}

	return { init, cancel, create, update, submit }
	
})();

const menu = (() => {
	// Host or Join game
	const launchLobby = (ev) => {
		let type = (ev.target.id?.match(/-(\w+)$/)||[])[1],
				path, msg, cancelAction,
				options = {
					playerName: $('[name="playerName"]').value,
					pid: $('[name="pid"]').value
				};
		if (type === 'host') {
			Object.assign(options, {
				gameName: $('[name="gameName"]').value ?? '',
				hostPort: $('[name="hostPort"]').value ?? 8080,
				hostIp: window.Game?.CONFIG?.NET?.PUBLIC_IP || '127.0.0.1',
				isHost: true
			});
			msg = `Starting game server "${options.gameName}" on port ${options.hostPort}`;
			cancelAction = 'main/killServer|killSocket';
			path = 'main/startServer';
		} else if (type === 'join') {
			Object.assign(options, {
				hostIp: $('[name="joinIp"]').value,
				hostPort: $('[name="joinPort"]').value,
			});
			msg = `Attempting to join server ${options.hostIp} on port ${options.hostPort}`;
			cancelAction = 'killSocket';
			path = 'joinServer';
		}
		modalUp(msg, cancelAction);
		renHub.trigger(path, { serverOptions: options });
	}

	// Supply truthy or falsy to force blur on or off, leave undefined for Auto
	const blurMainMenu = async (toggle) => {
		let mainMenu = $('#mainmenu');
		if (toggle === undefined) {
			if (mainMenu.classList.contains('show')) {
				let uiParts = $$('#mainmenu dialog.show');
				let zIndex = 0;
				uiParts.forEach(el => {
					let z = getComputedStyle(el)?.getPropertyValue('z-index');
					zIndex = z > zIndex ? z : zIndex;
				});
				let mainZ = getComputedStyle(mainMenu)?.getPropertyValue('z-index');
				rlog(`Max z was ${zIndex}, mainmenu was ${mainZ}`);
				toggle = (mainZ > zIndex) ? 0 : 1;
			}
		}
		if (toggle) mainMenu.classList.add('disabled-blur');
		else mainMenu.classList.remove('disabled-blur');
	}

	const modalUp = async (msg, buttonEvents, blurMain=true) => {
		renHub.trigger('fadeElement', '#loading-modal', 'in', 100);
    if (blurMain) blurMainMenu(1);
    $('#loading-modal .launch-message').innerHTML = msg||'Launching...';
		$('#loading-modal .modal-button').dataset.events = buttonEvents;
  }
  const modalDown = async (unBlur) => {
		renHub.trigger('fadeElement', '#loading-modal', 'out', 500);
		let actions = $('#loading-modal .modal-button').dataset?.events;
		if (actions) {
			actions = actions.split('|');
			actions.forEach(ev => renHub.trigger(ev));
		}
		blurMainMenu(unBlur ? 0 : undefined);
  }

  const toggleMenuItem = (ev) => {
    let itemId = (ev.target.id?.match(/-(\w+)$/)||[])[1];
    if (!itemId) return rlog([`Bad button press from menu item`, ev], 'warn');
    let toggles = Array.from($$('input.toggle'));
    toggles.forEach(t => t.value = t.name.indexOf(itemId) > -1 ? 1-t.value : 0);
  };

	return { launchLobby, blurMainMenu, modalUp, modalDown, toggleMenuItem	}

})();