// server event hub landing
import { EventHub } from '../shared/EventHub.mjs';
import { DebugLogger } from '../shared/DebugLogger.mjs';

const debug = 1;
export const serverHub = new EventHub('serverHub');
export const slog = new DebugLogger('server', serverHub, debug, 1);

(async () => {
	// slog(`Server Hub online`);
})