import { slog, serverHub } from "../serverHub.mjs"

export const handleChat = async (msgData) => {
	// handle chat message
	slog([`Chat message received: `, msgData]);
	msgData.from = msgData.pid;
	if (msgData.type === 'whisper') {
		msgData.targets = Array.from(new Set([msgData.target, msgData.from]));
		serverHub.trigger('client/chatMessage', msgData);
	} else {
		serverHub.trigger('clients/chatMessage', msgData);
	}
}