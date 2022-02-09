import { slog } from "../serverHub.mjs";

export class HouseList {
	
	constructor(playerList) {
		slog(playerList);
		Object.assign(this, playerList);
	}
	
}