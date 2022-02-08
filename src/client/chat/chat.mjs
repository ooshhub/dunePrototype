import { rlog, renHub } from '../rendererHub.mjs';
import { ChatMessage } from './ChatMessage.mjs';

const postMessage = async (msg) => {
	const message = msg ? new ChatMessage(msg) : null;
	if (message.type === 'error') renderMessage(message);
	else renHub.trigger('server/postMessage', message);
}

const renderMessage = async (msg) => {
	rlog([`Chat Message received: `, msg]);
	// TODO: if Whisper received, store PID for reply functionality
}

const chatPaste = async (content) => {
	rlog([`Chat paste detected`, content]);
	// TODO: handle pasting of images
}

const chatBlur = async () => {
	// set fadeout timer on blur
}


export const initChat = async () => {
	const chatInput = $('main#chat #chatinput'),
		chatLog = $('main#chat .log');
	if (!chatInput || !chatLog) return rlog(`initChat error: `);
	chatInput.addEventListener('change', async (ev) => {
		rlog([`Chat message recieved:`, ev.target.value]);
		postMessage(ev.target.value?.trim());
	});
	chatInput.addEventListener('paste', chatPaste)
	// register handler for chat blur
	renHub.on('chatMessage', renderMessage);
}