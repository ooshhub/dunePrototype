import { helpers } from "../../../shared/helpers.mjs";

export const houseNames = {
  generate: function(house) {
    if (!house || !this[house]) return null;
    const nameType = this.calculateWeighting(this[house].weight.type);
    let [first, middle, last, mono] = ['first', 'middle', 'last', 'mono'].map(part => this.calculateWeighting(this[house].weight[part]));
    [first, middle, last, mono] = [first, middle, last, mono].map((partStyle, i) => this.getName(house, i, partStyle));
    // console.log(nameType)
    return (nameType === 'mono' ? `${mono}`
      : nameType === 'firstMiddleLast' ? `${first} ${middle} ${last}`
      : nameType === 'firstLast' ? `${first} ${last}`
      : `Murgatroid`
    );
  },
  calculateWeighting: function(weights) {
    let result;
    const totalOdds = Object.values(weights).reduce((a, v) => a += v, 0),
      roll = helpers.randomInt(totalOdds);
    Object.entries(weights).reduce((acc, kv) => {
      if (!result) {
        acc += kv[1];
        if (roll < acc) result = kv[0];
      }
      return acc;
    }, 0);
    return result;
  },
  getName: function(house, part, style) {
    part = typeof(part) === 'string' ? part : part === 0 ? 'first' : part === 1 ? 'middle' : part === 2 ? 'last' : part === 3 ? 'mononym' : null;
    const getNamePart = (component) => {
      const namePart = this[house][part][component][helpers.randomInt(this[house][part][component].length)];
      return namePart;
    }
    return (
      style === 'full' ? getNamePart('full')
      : /two/i.test(style) ? `${getNamePart('start')}${getNamePart('end')}`
      : style === 'threePart' ? `${getNamePart('start')}${getNamePart('mid')}${getNamePart('end')}`
      : style === 'none' ? ''
      : 'Murgatroid');
  },
  atreides: {
    mononym: {
      full: ['Grobulus the Unworthy'],
    },
    first: {
      full: ['Paulus', 'Antonius', 'Dante'],
      start: ['Brut', 'Letol', 'Paul', 'Fidel', 'Fater', 'Anal'],
      mid: ['ali', 'ant'],
      end: ['o', 'us', 'i', 'es', 'ae', 'aes'],
    },
    middle: {
      full: ['da', 'de'],
      start: [],
      mid: [],
      end: [],
    },
    last: {
      full: ['Tudesco', 'Abalores'],
      start: ['Pal', 'Val', 'Abor', 'Ego', 'Idris', 'Vitor'],
      mid: ['par', 'let'],
      end: ['eo', 'eus', 'ant', 'ego'],
    },
    weight: {
      type: {
        mono: 1,
        firstLast: 5,
        firstMiddleLast: 4,
      },
      mono: { full: 1 },
      first: {
        full: 1,
        twoPart: 3,
        threePart: 3,
      },
      middle: {
        full: 1,
        twoPart: 0,
        threePart: 0,
      },
      last: {
        full: 2,
        twoPart: 10,
        threePart: 5,
      },
    },
  },
  harkonnen: {},
}

console.log(houseNames.generate('atreides'));