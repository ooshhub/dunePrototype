// Main menu scripts
// import { helpers } from '../../shared/helpers.mjs';
import { rlog, renHub } from '../rendererHub.mjs';

const $$ = window.$$;
const $ = window.$;


export const initMainMenu = async () => {
	await window.Dune.Helpers.watchCondition(() => document.ready);
	// Menu buttons
	$$('button.expandable').forEach(b => b.addEventListener('click', menu.toggleMenuItem));
	$$('input.toggle').forEach(t => t.value = 0);
	$$('button.launch').forEach(b => b.onclick = menu.launchGame);
	$('.modal-button').addEventListener('click', menu.modalDown);
	$('#menu-quit')?.addEventListener('click', () => renHub.trigger('main/exitGame'));
	renHub.on('mainMenuModalDown', menu.modalDown);
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
		});
	}
	// renHub.trigger('main/mainMenuLoaded')
	return 1;
}

const menu = (() => {
	// Host or Join game
	const launchGame = (ev) => {
		let type = (ev.target.id?.match(/-(\w+)$/)||[])[1],
				path, msg, cancelAction,
				options = {
					playerName: $('[name="playerName"]').value,
					pid: $('[name="playerId"]').value
				};
		if (type === 'host') {
			Object.assign(options, {
				gameName: $('[name="gameName"]').value,
				hostPort: $('[name="hostPort"]').value,
				hostIp: window.Game?.CONFIG?.NET?.PUBLIC_IP || '127.0.0.1',
				isHost: true
			});
			msg = `Starting game server "${options.gameName}" on port ${options.hostPort}`;
			cancelAction = 'main/killServer|killSocket';
			path = 'main/startServer';
		} else if (type === 'join') {
			Object.assign(options, {
				hostIp: $('[name="ip"]').value,
				hostPort: $('[name="portjoin"]').value,
			});
			msg = `Attempting to join server ${options.hostIp} on port ${options.hostPort}`;
			cancelAction = 'killSocket';
			path = 'joinServer';
		}
		modalUp(msg, cancelAction);
		renHub.trigger(path, { serverOptions: options });
	}

	const modalUp = async (msg, buttonEvents, blurMain=true) => {
    $('input[name="modalup"]').value = 1;
    if (blurMain) $('main#mainmenu').classList.add('disabled-blur');
    $('#loading-modal .launch-message').innerHTML = msg||'Launching...';
		$('#loading-modal .modal-button').dataset.events = buttonEvents;
  }
  const modalDown = async () => {
		let actions = $('#loading-modal .modal-button').dataset?.events;
		if (actions) {
			actions = actions.split('|');
			actions.forEach(ev => renHub.trigger(ev));
		}
    $('main#mainmenu').classList.remove('disabled-blur');
    $('input[name="modalup"]').value = 0;
  }

  const toggleMenuItem = (ev) => {
    let itemId = (ev.target.id?.match(/-(\w+)$/)||[])[1];
    if (!itemId) return rlog([`Bad button press from menu item`, ev], 'warn');
    let toggles = Array.from($$('input.toggle'));
    toggles.forEach(t => t.value = t.name.indexOf(itemId) > -1 ? 1-t.value : 0);
  };

	return { launchGame, modalUp, modalDown, toggleMenuItem	}

})();