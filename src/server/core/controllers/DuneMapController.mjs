import { Helpers } from "../../../shared/Helpers.mjs";
// import { slog } from "../serverHub.mjs";

export class DuneMapController {

  #regions = {};

  constructor(mapData) {
    mapData = typeof(mapData) === 'object' ? mapData : defaultMap;
    this.name = mapData.name;
    this.id = mapData.id;
    mapData.regions?.forEach(r => { this.#regions[r.id] = new MapRegion(r) });
  }

  get appendFields() { return { _regions: this.#regions } }

  get regions() { return this.#regions }
  get regionList() { return Object.keys(this.#regions) }

  isRegion(regionId) { return this.#regions[regionId] ? true : false }

}

class MapRegion {
  constructor(data) {
    // TODO: still need to handle anchor coordinates for dropping tokens.
    // How to handle 6 players all moving to a single sector of a small Region???
    Object.assign(this, {
      name: data.name || Helpers.deCamelise(data.id) || `New Region`,
      id: data.id || Helpers.camelise(data.name) || 'newRegion',
      terrain: data.terrain || 'rock',
      spiceBloom: data.spiceBloom ?? false,
      stormSectors: Helpers.toArray(data.stormSectors) || [],
      borders: Helpers.toArray(data.borders) || [],
      // Still needs: coordinates of token anchor(s)
    });
  }
}

const defaultMap = {
  name: 'Arrakis Default',
  id: 'arrakisDefault',
  initialSetup: {
    treachery: { x:500, y:500 },
    spice: { x:800, y:500 },
  },
  stormSectors: 18,
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
      name: 'Arrakeen',
      id: 'arrakeen',
      terrain: ['settlement'],
      spiceBloom: false,
      stormSectors: [],
      borders: []
    }
  ]
}