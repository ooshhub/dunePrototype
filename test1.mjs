const determinePlayerOne = (stormPosition, dots) => {
	const nearestIndex = dots.findIndex(v => v >= stormPosition);
	if (dots[nearestIndex] === stormPosition) {
		return nearestIndex;
	} else {
		const splitRoll = Math.random();
		const playerOneIndex = splitRoll > dots[nearestIndex]%1 ? nearestIndex : nearestIndex - 1;
		console.log(`First player is player ${playerOneIndex}`);
		const newArray = [];
		newArray.push(players.splice(playerOneIndex, players.length - playerOneIndex).concat(players));
		return newArray;
	}
}

const assignPlayerDots = (numPlayers) => {
	const stormSectors = 18;
	const dotProgression = stormSectors/(numPlayers);
	const dots = [];
	for (let i=0; i<numPlayers; i++) {
		dots.push(i*dotProgression);
	}
	return dots;
}

const names = ['a','b','c','d','e','f'];

const players = Array(6).fill().map((x,i) => names[i]);
console.log(players);

const playerDots = assignPlayerDots(5);
console.log(playerDots);

const turnOrder = determinePlayerOne(7, playerDots);
console.log(turnOrder.join(', '));