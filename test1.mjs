const generateHouseIds = (playerList) => {
	const output = {};
	let increment = 1;
	for (let p in playerList) {
		const pid = playerList[p].pid, houseInitial = playerList[p].house[0];
		const hid = `${pid[0]}${houseInitial}_${increment}${pid.slice(3)}`.slice(0,19);
		Object.assign(output, { [pid]: hid });
		increment ++;
	}
	return output;
}

const players = {
	1: {
		pid: `o_dfij2893hf82hefh20dsg9`,
		house: 'atreides'
	},
	2: {
		pid: `f_fihsjh98gh3428gh0egjh093jg`,
		house: 'harkonnen'
	}
}

console.log(generateHouseIds(players));