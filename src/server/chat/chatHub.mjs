import { slog, serverHub } from "../serverHub.mjs";
import { Helpers } from "../../shared/Helpers.mjs";

export const handleChat = async (msgData) => {
	// handle chat message
	slog([`Chat message received: `, msgData]);
	msgData.from = msgData.pid;
	if (msgData.type === 'whisper') {
		const msgSender = Helpers.cloneObject(msgData);
		msgSender.type = 'whisper-sent';
		msgSender.targets = msgData.from;
		msgData.targets = msgData.target;
		serverHub.trigger('client/chatMessage', msgData);
		serverHub.trigger('client/chatMessage', msgSender);
	} else {
		serverHub.trigger('clients/chatMessage', msgData);
	}
}