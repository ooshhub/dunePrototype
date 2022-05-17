import * as Pixi from './lib/pixi.mjs';

export class CanvasUtilities {

  constructor() { throw new Error(`${this.constructor.name} cannot be instantiated.`) }

  static regionMap = {
    getRegionFromIndex: function(index) {
      return Object.entries(this).find(kv => (typeof(kv[1]) === 'number' && kv[1] === index) ? kv[0] : null)?.[0] ?? null;
    },
    polarSink: 0,
    falseWallEast: 1,
    minorErg: 2,
    shieldWall: 3,
    pastyMesa: 4,
    garKulon: 5,
    tueksSietch: 6,
    falseWallSouth: 7,
    cielagoNorth: 8,
    cielagoDepression: 9,
    cielagoEast: 10,
    cielagoSouth: 11,
    meridian: 12,
    cielagoWest: 13,
    windPassNorth: 14,
    sihayaRidge: 15,
    holeInTheRock: 16,
    basin: 17,
    rimWallWest: 18,
    arrakeen: 19,
    oldGap: 20,
    imperialBasin: 21,
    carthag: 22,
    tsimpo: 23,
    brokenLand: 24,
    arsunt: 25,
    haggaBasin: 26,
    plasticBasin: 27,
    windPass: 28,
    greatFlat: 29,
    greaterFlat: 30,
    falseWallWest: 31,
    habbanyaRidgeFlat: 32,
    habbanyaErg: 33,
    funeralPlain: 34,
    bightOfTheCliff: 35,
    sietchTabr: 36,
    rockOutcroppings: 37,
    habbanyaSietch: 38,
    hargPass: 39,
    redChasm: 40,
    southMesa: 41,
  }

  static svgToData(textStream, options = { namePrefix: '', nameSuffix: '', nameMap: null, useNameIndex: false, useClassIndex: false }) {
    const output = { styles: [], shapes: [] }
    const usedNames = {};
    textStream = textStream.replace(/\n\t/g, '');
    const styles = textStream.match(/<style.*?>(.*)<\/style>/s)?.[1] ?? '',
      pathMatches = textStream.matchAll(/<(polygon|path|polyline|circle|ellipse|line|rect)([^/]*)\//gs);
    let stylesParts = styles.replace(/\n/g, '').split(/}/g) || [];
    stylesParts.forEach(part => {
      let ruleParts = part.split(/{/);
      if (ruleParts.length === 2) output.styles.push({ selector: ruleParts[0], rule: ruleParts[1] });
      else console.warn(`Invalid CSS rule ignored.`);
    });
    const processPath = (inputString) => {
      const output = [];
      const pathSections = inputString.matchAll(/([A-Za-z])([^A-Za-z]*)/g);
      for (const section of pathSections) {
        const command = section[1],
          coords = section[2]
            .replace(/(\d)\s+(\d)/g, '$1,$2')
            .replace(/(\d)(-\d)/g, '$1,$2')
            .replace(/(\d)(-\d)/g, '$1,$2')
            .split(/\s*,\s*/g);
        output.push({ type: command, points: coords.map(c => parseFloat(c)??null).filter(v=>v != null) });
      }
      return output;
    }
    const processPolygon = (inputString) => inputString.split(/(\s*,\s*|\s+)/g).reduce((acc, p) => parseFloat(p) ? acc.concat(parseFloat(p)) : acc, []);
    let index = 0;
    for (const path of pathMatches) {
      // console.log(path);
      const outputPath = { type: path[1] };
      const attributes = path[2].matchAll(/(\w+)="([^"]*)"/g);
      for (const attr of attributes) {
        if (attr[1] === 'points') outputPath[attr[1]] = processPolygon(attr[2]);
        else if (attr[1] === 'd') outputPath[attr[1]] = processPath(attr[2]);
        else outputPath[attr[1]] = attr[2];
      }
      const nameMap = typeof(options.nameMap) === 'string' ? CanvasUtilities[options.nameMap] : options.nameMap;
      const classIndex = parseInt(outputPath.class.replace(/\D/g, ''));
      // console.log(`nameMap and classIndex`, nameMap, classIndex);
      let baseName = outputPath.id ? outputPath.id 
        : nameMap && typeof(classIndex) === 'number' ? nameMap.getRegionFromIndex(classIndex)
        : classIndex ?? index;
      baseName = options.useClassIndex ? `${baseName}-${classIndex}` : baseName;
      // console.log(baseName);
      usedNames[baseName] = usedNames[baseName] > -1 ? usedNames[baseName] + 1 : 0;
      const nameIndex = usedNames[baseName];
      outputPath.name = `${options.namePrefix??''}${baseName}${options.nameSuffix??''}${options.useIndex ? `-${nameIndex}` : ''}`;
      output.shapes.push(outputPath);
      index++;
    }
    return output;
  }

  static scaleAndOffsetShape = (shape, scale = { x: 1, y: 1 }, offset = { x: 0, y: 0 } ) => {
    const scaleAndOffset = (array, applyScale = true, applyOffset = true, switchAxis = false) => array.map((p,i) => {
      i = switchAxis ? i + 1 : i;
      return (i%2 === 0) ? p*(applyScale ? scale.x : 1) + (applyOffset ? offset.x : 0) : p*(applyScale ? scale.y : 1) + (applyOffset ? offset.y : 0);
    });
    if (shape.type === 'polygon') {
      // console.log(shape.points);
      shape.points = scaleAndOffset(shape.points);
    }
    else if (shape.type === 'path') {
      for (let i=0; i<shape.d.length; i++) {
        // Swap axis for vertical lines in scaleAndOffset()
        let axisSwap = /v/i.test(shape.d[i].type) ? true : false;
        // console.log(shape.d[i].type);
        if (/a/i.test(shape.d[i].type)) {
          const radius = shape.d[i].points[4] ?? 0;
          shape.d[i].points = scaleAndOffset(shape.d[i].points);
          shape.d[i].points[4] = radius;
        }
        else if (/[A-Zm]/.test(shape.d[i].type)) {
          shape.d[i].points = scaleAndOffset(shape.d[i].points, true, true, axisSwap);
        }
        else shape.d[i].points = scaleAndOffset(shape.d[i].points, true, false, axisSwap);
      }
    }
    else if (shape.type === 'rect') {
      // console.log(shape);
      const [sx, sy] = scaleAndOffset([shape.x, shape.y]);
      const [sw, sh] = scaleAndOffset([shape.width, shape.height], true, false);
      // ['x','y'].forEach(attr => shape[attr] = scaleAndOffset(shape[attr]));
      // ['width','height'].forEach(attr => scaleAndOffset(shape[attr], true, false));
      Object.assign(shape, { x: sx, y: sy, width: sw, height: sh });
    }
    return shape;
  }

  static async drawPixiGraphicFromSvgData(shape, pixiGraphic) {
    const reflectControlPoint = (lastCp, lastPos, /* currentPos, relative */) => {
      // use delta to adjust for relative coordinates
      // const delta = { x: relative ? currentPos.x - lastPos.x : 0, y: relative ? currentPos.y - lastPos.y : 0 };
      const reflect = [ (2*lastPos.x - lastCp.x) /* + delta.x */, (2*lastPos.y - lastCp.y)/*  + delta.y  */];
      // console.log(delta, reflect);
      return reflect;
    }
    pixiGraphic = pixiGraphic?.constructor?.name === 'Graphics' ? pixiGraphic : null;
    if (!pixiGraphic) return console.error(`drawPixiFromSvg: Must supply a graphic object.`);

    if (shape.type === 'path') {
      const last = {
        type: null,
        x: null,
        y: null,
        cX1: null,
        cY1: null,
        cX2: null,
        cY2: null,
      };
      shape.d.forEach(command => {
        let coords = command.points ?? [];
        // console.log(coords);
        // Handle difference between UPPER and lower
        if (/[lhcsqt]/.test(command.type)) coords = coords.map((p,i) => (i%2===0) ? p + last.x : p + last.y);
        else if (/v/.test(command.type)) coords[0] = coords[0] + last.y;
        else if (/a/.test(command.type)) coords = coords.map((p,i) => (i===4) ? p : (i%2===0) ? p + origin.x : p + origin.y);
        // console.log(command.type, coords);
        const lowerCommand = command.type.toLowerCase();
        switch(lowerCommand) {
          case 'm': {
            pixiGraphic.moveTo(...coords);
            Object.assign(last, { x: coords[0], y: coords[1] });
            break;
          }
          case 'l': {
            pixiGraphic.lineTo(coords[0], coords[1]);
            Object.assign(last, { x: coords[0], y: coords[1] });
            break;
          }
          case 'v': {
            pixiGraphic.lineTo(last.x, coords[0]);
            Object.assign(last, { y: coords[0] });
            break;
          }
          case 'h': {
            // console.log(`horizontal: ${last.x},${last.y} => ${coords[0]},${last.y}`);
            pixiGraphic.lineTo(coords[0], last.y);
            Object.assign(last, { x: coords[0] });
            break;
          }
          case 'a': {
            pixiGraphic.arcTo(...coords);
            Object.assign(last, { x: coords[2], y: coords[3] });
            break;
          }
          case 'c': {
            pixiGraphic.bezierCurveTo(...coords);
            Object.assign(last, { x: coords[4], y: coords[5], cX1: coords[0], cY1: coords[1], cX2: coords[2], cY2: coords[3] });
            break;
          }
          case 's': {
            const reflection = reflectControlPoint({ x: last.cX2, y: last.cY2 }, {x: last.x, y: last.y }, { x: coords[2], y: coords[3] }, /s/.test(command.type));
            pixiGraphic.bezierCurveTo(...reflection, ...coords);
            Object.assign(last, { x: coords[2], y: coords[3], cX1: reflection[0], cY1: reflection[1], cX2: coords[0], cY2: coords[1] });
            break;
          }
          case 'q': {
            pixiGraphic.quadraticCurveTo(...coords);
            Object.assign(last, { x: coords[2], y: coords[3], cX1: coords[0], cY1: coords[1] });
            break;
          }
          case 't': {
            const reflection = reflectControlPoint(coords[2], coords[3], last.cX1, last.cY1, last.x, last.y, /t/.test(command.type));
            pixiGraphic.bezierCurveTo(...reflection, ...coords);
            Object.assign(last, { x: coords[2], y: coords[3], cX1: reflection[0], cY1: reflection[1] });
            break;
          }
          case 'z': {
            pixiGraphic.closePath();
          }
        }
      });
    }
    else if (shape.type === 'polygon') {
      const poly = new Pixi.Polygon(...shape.points);
      pixiGraphic.drawPolygon(poly);
    }
    else if (shape.type === 'rect') {
      console.warn('RECT');
      pixiGraphic.drawRect(shape.x, shape.y, shape.width ?? 0, shape.height ?? 0);
    }
    return pixiGraphic;
  }
}