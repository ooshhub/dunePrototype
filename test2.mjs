const line = [0, 0, -60, -100];

class PlayerLine {

  #lineData = {
    pos1: {},
    pos2: {},
    deltaX: null,
    deltaY: null,
    length: null,
    angle: null,
  }

  #config = {
    tokenRadius: 10,
    maxSpacing: 5,
  }

  constructor(...args) {
    const points = Array.isArray(args[0]) ? args[0] : args;
    if (points.length !== 4) return console.warn(`getLineLength requires 4 coordinates.`);

    this.#lineData.deltaX = points[2] - points[0],
    this.#lineData.deltaY = points[3] - points[1];
    this.#lineData.length = (this.#lineData.deltaX**2 + this.#lineData.deltaY**2)**(1/2);
    this.#lineData.angle = Math.atan(this.#lineData.deltaX/this.#lineData.deltaY);
  }

  get lineData() { return this.#lineData }

  #toDegrees(rads) { return (180/Math.PI)*rads; }
  #toRadians(degs) { return degs/(180/Math.PI); }

  #getLineEndpoint(length) {
    const offset = { x: Math.abs(length*(Math.sin(this.#lineData.angle))), y: Math.abs(length*(Math.cos(this.#lineData.angle))) }
    return {
      x: offset.x && this.#lineData.deltaX < 0 ? -offset.x : offset.x,
      y: offset.y && this.#lineData.deltaY < 0 ? -offset.y : offset.y,
    }
  }

  getTokenCoords(numTokens) {
    if (!(numTokens > 0)) return;
    // Check if tokens need to be centered
    const totalPixels = (numTokens*this.#config.tokenRadius*2) + (numTokens-1)*this.#config.maxSpacing,
      totalLineLength = this.#lineData.length + this.#config.tokenRadius*2,
      spareLength = totalLineLength - totalPixels;
    const offset = (spareLength > 0) ? spareLength/2 : null;
    const coords = [];
    for (let i=0; i < numTokens; i++) {
      const partLineLength = offset
        ? offset + (i*(this.#config.tokenRadius*2 + this.#config.maxSpacing))
        : this.#lineData.length/((numTokens-1)||1) * i;
      coords.push(this.#getLineEndpoint(partLineLength));
    }
    return coords;
  }
  
}

const fiftyYears = 1653229126846,
  billionYears = 2.6*fiftyYears;

const newDate = new Date(billionYears);

console.log(newDate.toLocaleDateString());

const newLine = new PlayerLine(line);
console.log(newLine.lineData);
// console.log(newLine.getLineEndpoint(30));
console.log(...newLine.getTokenCoords(2))

const randomInt = (range=100, depth=32) => {
  const max = range * 2**depth;
  let random;
  do { random = Math.floor(Math.random() * 2**depth) }
  while (random >= max);
  return random % range;
}
const generateUID = (numIds = 1) => {
  let output = [], key = '';
  const chars = '-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
  let ts = billionYears;
  for (let i = 8; i > 0; i--) { output[i] = chars.charAt(ts % 64), ts = Math.floor(ts / 64) }
  for (let j = 0; j < 12; j++) { output.push(chars.charAt(randomInt(64))) }
  key = output.join('');
  if (numIds > 1) {
    numIds = Math.min(32, numIds);
    output = Array(numIds).fill().map((v,i) => {
      let lastChar = chars[(chars.indexOf(key[19])+i)%64];
      return `${key.slice(0,18)}${lastChar}`;
    });
    return output;
  } else return key;
}

console.log(generateUID());