class test {
	
	#pid = 'aaa';
	#houses = {
		one: {
			pid: 'aaa'
		},
		two: {
			pid: 'a',
			stuff: 'hello cunt'
		}
	}

	get currentHouse() { return (this.#pid && this.#houses) ? Object.entries(this.#houses).map(h=> h[1]?.pid === this.#pid ? h[1] : null).filter(v=>v)[0] : null }

}

const testcase = new test();

console.log(testcase.currentHouse)