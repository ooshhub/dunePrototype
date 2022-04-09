export class Container {

	#tray = new Tray();
	#board = new Board();

	constructor() {
		Object.assign(this, {
			name: 'myContainer',
			description: 'Fuck you'
		});
	}

	obby = {
		one: 'this',
		two: 'that',
		three: () => {}
	}

	get privateFields() { return [this.#tray, this.#board] }

}

class Tray {

	#contents = ['tok1', 'tok2'];

	constructor() {
		Object.assign(this, {
			name: 'myTray'
		})
	}


}

class Board {

	#regions = {
		blap: 'flip',
		erg: 'spopwop'
	}

	constructor() {
		Object.assign(this, {
			name: 'myBoard'
		});
	}
}