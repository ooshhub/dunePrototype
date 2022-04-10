const _Dune = {
	houses: {
		one: 'atreides',
		two: 'harkonnen',
	},
	players: {
		one: 1,
		two: 2
	}
}

const Dune = new Proxy(_Dune, {
	// get(...args) {
	// },
	set() { return null }
});

Dune.houses.one = 'blah';
// Succeeds, proxy set() only traps {houses}
// Can only stop this with a get() trap, but that stops everything
console.log(Dune.houses)