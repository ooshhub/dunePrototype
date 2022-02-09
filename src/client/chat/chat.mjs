import { rlog, renHub } from '../rendererHub.mjs';
import { ChatMessage } from './ChatMessage.mjs';

const chatInput = $('main#chat #chatinput');
const chatLog = $('main#chat .log');


const postMessage = async (msg) => {
	rlog(`Message received: ${msg}`);
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
	rlog(msgHtml);
	chatLog.insertAdjacentHTML('beforeend', msgHtml);
}

const chatPaste = async (content) => {
	rlog([`Chat paste detected`, content]);
	// TODO: handle pasting of images
}

// const chatBlur = async () => {
// 	// set fadeout timer on blur
// }


export const initChat = async () => {
	if (!chatInput || !chatLog) return rlog(`initChat error: `);
	chatInput.addEventListener('keyup', async (ev) => {
		if (ev.key === 'Enter') {
			const msg = ev.target.value.trim();
			if (msg) postMessage(msg);
			chatInput.value = '';
		}
	});
	chatInput.addEventListener('onbeforepaste', chatPaste)
	// register handler for chat blur
	renHub.on('chatMessage', renderMessage);
}