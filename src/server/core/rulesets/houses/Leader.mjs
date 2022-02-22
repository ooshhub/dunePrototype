export class Leader {

	constructor(leaderData, index) {
		this.name = leaderData.name;
		this.id = `leader${index}`;
		this.strength = leaderData.strength;
		this.alive = true;
		this.traitor = null;
	}
	
}