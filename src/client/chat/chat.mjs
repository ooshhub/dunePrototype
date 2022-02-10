import { rlog, renHub } from '../rendererHub.mjs';
import { ChatMessage } from './ChatMessage.mjs';

const chatBox = $('main#chat');
const chatInput = $('main#chat #chatinput');
const chatLog = $('main#chat .log');
const chatResize = $('main#chat .resize-handle');

const postMessage = async (msg) => {
	// rlog(`Message received: ${msg}`);
	const message = msg ? new ChatMessage(msg) : null;
	if (message.type === 'error' || message.type === 'whisper-self') renderMessage(message);
	else renHub.trigger('server/postMessage', message);
}

const renderMessage = async (msg) => {
	const players = window.Dune.Players;
	const activePlayer = window.Dune.ActivePlayer;
	// rlog([`Chat Message received: `, msg]);
	if (!msg.type) return rlog([`Bad message data`]);
	let msgHtml = `<div class="chat-message ${msg.type}">`;
	if (msg.type === 'whisper') activePlayer.lastWhisper = msg.from;
	if (msg.type === 'whisper-sent' || msg.type === 'whisper-self') msgHtml += `to ${players[msg.target]?.playerName??'Player'}: `;
	else if (msg.type === 'general' || msg.type === 'whisper') msgHtml += `${players[msg.from].playerName??'Player'}: `;
	msgHtml +=`${msg.content}</div>`;
	// rlog(msgHtml);
	chatLog.insertAdjacentHTML('beforeend', msgHtml);
}

const chatPaste = async (content) => {
	rlog([`Chat paste detected`, content]);
	// TODO: handle pasting of images
}

// TODO: restructure HTML to allow textarea input to expand
// TODO: decide on combat/event log tab, and whether to fade out chatlog area on timer when blurred

const allowResizeFrame = (target, handle) => {
	const handleEl = typeof(handle) === 'string' ? $(handle) : handle;
	const targetEl = typeof(target) === 'string' ? $(target) : target;
	if (!handleEl || !targetEl) rlog(`resizeFrame error: bad selector "${handle}" or "${target}"`, 'error');
	handleEl.addEventListener('mousedown', (downEv) => {
		// rlog('Starting resize...');
		const pos_i = { x: downEv.clientX, y: downEv.clientY };
		let sizeChanged = false;
		targetEl.classList.add('disabled');
		const resizeFrame = (moveEv) => {
			// rlog('resizing...')
			const deltaX = pos_i.x - moveEv.clientX,
				deltaY = pos_i.y - moveEv.clientY,
				newWidth = targetEl.offsetWidth + deltaX,
				newHeight = targetEl.offsetHeight + deltaY;
			targetEl.style.width = `${newWidth}px`;
			targetEl.style.height = `${newHeight}px`;
			// rlog([newWidth, newHeight]);
			// rlog([targetEl.style.width, targetEl.style.height]);
			Object.assign(pos_i, { x: moveEv.clientX, y: moveEv.clientY });
			sizeChanged = true;
		};
		document.addEventListener('mousemove', resizeFrame);
		document.addEventListener('mouseup', () => {
			document.removeEventListener('mousemove', resizeFrame);
			chatBox.classList.remove('disabled');
			if (sizeChanged) renHub.trigger('main/writeConfig', { path: 'userSettings/ui/chatWindow', data: { x: chatBox.offsetWidth, y: chatBox.offsetHeight } } );
			sizeChanged = false;
		});
	});
}


export const initChat = async () => {
	if (!chatInput || !chatLog) return rlog(`initChat error: missing HTML`, 'warn');
	chatInput.addEventListener('keyup', async (ev) => {
		if (ev.key === 'Enter' && !ev.shiftKey) {
			const msg = ev.target.value.trim();
			if (msg) postMessage(msg);
			chatInput.value = '';
		}
	});
	chatInput.addEventListener('onbeforepaste', chatPaste);
	// Restore chat box size, and allow resize
	const dimensions = window.Dune.CONFIG?.userSettings?.ui?.chatWindow;
	chatBox.style.width = dimensions?.x > 200 ? `${dimensions.x}px` : ``;
	chatBox.style.height = dimensions?.y > 200 ? `${dimensions.y}px` : ``;
	allowResizeFrame(chatBox, chatResize);
	// register handler for chat blur
	renHub.on('chatMessage', renderMessage);
}