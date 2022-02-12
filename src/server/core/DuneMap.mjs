export class DuneMap {

	#regions = [];

	constructor(mapData) {
		mapData = typeof(mapData) === 'object' ? mapData : defaultMap;
	}

}

const defaultMap = {
	name: 'Arrakis Default',
	regions: [
		{
			name: 'Polar Sink',
			id: 'polarSink',
			terrain: ['polar'],
			spiceBloom: false,
			stormSectors: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],
			borders: ['falseWallEast', 'imperialBasin', 'arsunt', 'haggaBasin', 'windPass', 'windPassNorth', 'cielagoNorth', 'hargPass'],
		},
		{
			name: 'False Wall East',
			id: 'falseWallEast',
			terrain: ['rock'],
			spiceBloom: false,
			stormSectors: [0,1,2,16,17],
			borders: ['polarSink', 'hargPass', 'minorErg', 'shieldWall', 'imperialBasin']
		},
		{
			name: 'The Minor Erg',
			id: 'minorErg',
			terrain: ['sand'],
			spiceBloom: true,
			stormSectors: [17,0,1],
			borders: ['falseWallEast', 'shieldWall', 'pastyMesa', 'falseWallSouth', 'hargPass']
		},
		{
			name: 'Pasty Mesa',
			id: 'pastyMesa',
			terrain: ['rock'],
			spiceBloom: false,
			stormSectors: [16,17,0,1],
			borders: ['garaKulon', 'shieldWall', 'minorErg', 'falseWallSouth', 'tueksSietch', 'southMesa', 'redChasm']
		},
		{
			name: 'Red Chasm',
			id: 'redChasm',
			terrain: ['sand'],
			spiceBloom: true,
			stormSectors: [0],
			borders: ['pastyMesa', 'southMesa']
		},
		{
			name: 'Broken Land',
			id: 'brokenLand',
			terrain: ['sand'],
			spiceBloom: true,
			stormSectors: [],
			borders: []
		}
	]
}