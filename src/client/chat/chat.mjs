import { rlog } from '../rendererHub.mjs';

const postMessage = async () => {
	// send a message
}

const chatBlur = async () => {
	// set fadeout timer on blur
}


export const initChat = async () => {
	const chatInput = $('main#chat #chatinput'),
		chatLog = $('main#chat .log');
	if (!chatInput || !chatLog) return rlog(`initChat error: `);
	chatInput.addEventListener('change', )
}