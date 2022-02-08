import { slog, serverHub } from "../serverHub.mjs"

export const handleChat = async (msgData) => {
	// handle chat message
	slog([`Chat message received: `, msgData]);
}