import { Helpers } from '../shared/Helpers.mjs';

// const assetsPrefix = 'fakepath'

export const fetchAssetPath = (assetPath, custom = false) => {
  const assetsPrefix = window.Dune?.config?.PATH?.ASSETS;
  const processTree = (obj) => {
    const output = {};
    for (const key in obj) {
      if (typeof(obj[key]) === 'string') output[key] = `${assetsPrefix}/${obj[key]}`;
      else if (typeof(obj[key]) === 'object') output[key] = processTree(obj[key]);
    }
    return output;
  }
  if (!assetPath || typeof assetPath !== 'string') return null;
  if (custom) {
    // Custom graphics loader
  } else {
    let filePath = Helpers.getObjectPath(assetDirectory, assetPath, false);
    if (typeof(filePath) === 'object') {
      let subTree = Helpers.cloneObject(filePath);
      subTree = processTree(subTree);
      return subTree;
    }
    else if (typeof(filePath) === 'string') {
      return filePath ? `${assetsPrefix}/${filePath}` : '';
    }
    else return '';
  }
}


// File path relative to /assets root
const assetDirectory = {

  sprites: {
    maps: {
      arrakisDefault: `sprites/maps/arrakisNew.png`,
      test: `sprites/maps/testMap.png`,
    },
    cards: {
      treachery: {},
      spice: {},
    },
    tokens: {
      default: {},
      atreides: {
        soldiers: { normal: `sprites/tokens/soldiers/atreides.png` },
        leaders: {},
        special: {},
      },
      harkonnen: {
        soldiers: { normal: `sprites/tokens/soldiers/harkonnen.png` },
        leaders: {},
        special: {},
      },
      emperor: {
        soldiers: { normal: `sprites/tokens/soldiers/emperor.png`, elite: `sprites/tokens/soldiers/emperorElite.png` },
        leaders: {},
        special: {},
      },
      beneGesserit: {
        soldiers: { normal: `sprites/tokens/soldiers/atreides.png`, special: `sprites/tokens/soldiers/beneGesseritSpecial.png` },
        leaders: {},
        special: {},
      },
      fremen: {
        soldiers: { normal: `sprites/tokens/soldiers/atreides.png`, elite: `sprites/tokens/soldiers/fremenElite.png }` },
        leaders: {},
        special: {},
      },
      guild: {
        soldiers: { normal: `sprites/tokens/soldiers/atreides.png` },
        leaders: {},
        special: {},
      }
    },
  },

  art: {
    mentat: {
      rulers: {
        atreides: `mentat/rulerAtreides.png`,
        harkonnen: `mentat/rulerHarkonnen.png`
      },
      backgrounds: {
        arrakis1: `mentat/bgPlanetRise.jpg`
      }
    },
  },
  
  audio: {
    sounds: {},
    music: {},
  },

}

// console.log(fetchAssetPath('sprites/tokens/atreides'))
// console.log()