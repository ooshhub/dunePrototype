/* globals */

// Primary Pixi.js handler
import * as Pixi from './lib/pixi.mjs';
import { Layer, /* Background,*/ /* AnchorPoint */ } from './viewModels/tiles.mjs';
import { renHub, rlog, frameControl } from '../app.mjs';
import { helpers } from '../../shared/helpers.mjs';
import { PixiUiExtension } from './pixiUi.mjs';
import { fetchAssetPath } from '../../assets/assetDirectory.mjs';
import { CanvasUtilities as canvasUtilities } from './CanvasUtilities.mjs';

window.PIXI = Pixi;

export class StageManager {

  constructor() { throw new Error(`Cannot instantiate StageManager`) }

  static backgroundColor = 0xb4b4b4;
  static pixiLoader = Pixi.Loader.shared;
  static Textures = {};

  static handlersLoaded = 0;
  static #initCanvasHandlers() {
    renHub.on('initGameBoard', (...args) => StageManager.setupGameBoard(...args));
    this.handlersLoaded = 1;
  }

  // Load all sprite assets into Textures pack
  static async spriteLoader() {
    return new Promise((res, rej) => {
      this.pixiLoader.load((loader, content) => {
        let output = {};
        try { for (const asset in content) { output[asset] = new Pixi.Texture.from(content[asset].texture.baseTexture) } }
        catch(e) { rej(e) }
        this.Textures = helpers.unFlattenObjectPaths(output);
        window.Dune.textures = this.Textures;
        res();
      });
    });
  }

  // Compile token graphics
  static async buildAssetList() {
    const defaultAssets = {
      map: fetchAssetPath(`sprites/maps/arrakisDefault`),
      cards: fetchAssetPath('sprites/cards'),
      tokens: {
        default: fetchAssetPath('sprites/tokens/default')
      }
    };
    const housesInPlay = Object.values(window.Dune.houses).map(h => h.name);
    housesInPlay.forEach(house => {
      let housePath = fetchAssetPath(`sprites/tokens/${house}`);
      if (housePath) defaultAssets.tokens[house] = housePath;
    });
    // rlog(defaultAssets);
    const flattenedAssets = helpers.flattenObjectPaths(defaultAssets);
    for (const asset in flattenedAssets) this.pixiLoader.add(asset, flattenedAssets[asset]);
  }

  static async setupGameBoard(data) {
    // Throw up loading modal
    frameControl.createModal({
      type: 'loading',
      title: 'Loading',
      message: 'Setting up game...',
      destroyOnEvent: 'loadComplete:setupBoard',
      disableMain: true,
    });

    rlog([`Received setup data from server`, data], 'info');
    window.Dune.update('all', data);
    const setupData = {
      board: window.Dune.board,
      currentHouse: window.Dune.currentHouse,
      tray: window.Dune.tray,
      players: window.Dune.players,
      houses:  window.Dune.houses,
      map: window.Dune.map,
    }

    // set up Sprite asset list and build Texture data
    rlog([`stageManager setting up board from data: `, setupData]);
    await this.buildAssetList();
    await this.spriteLoader();
    // rlog(this.Textures);

    await frameControl.hideElements(['main#mainmenu', '#lobby'], 'slow');

    // Draw & position the Board
    const stage = window.Dune.layers.stage,
      map = new Pixi.Sprite(this.Textures.map);
    map.anchor.set(0.5);
    map.name = 'map';
    const mapCentre = { x: stage.x + (window.innerWidth/2), y: stage.y + (window.innerHeight/2) };
    stage.position = mapCentre;
    // window.Dune.layers.background.addChild(map);
    window.Dune.layers.background.addChild(map);
    // Use requestAnimationFrame to wait for board to finish drawing
    // await helpers.animationFrameBreak();
    await helpers.timeout(500);
    await helpers.animationFrameBreak();
    // Fade main sections, then remove loading modal

    await frameControl.showElements('main#gamecanvas', 'slow');

    renHub.trigger('loadComplete:setupBoard');
    window.Dune.session.update('GAME');

  /***** SVG TESTING *****/
    const mapSize = { x: map.width, y: map.height };

    const mapOverlay = new Layer(window.Dune.layers.background, 'mapOverlay', true);
    mapOverlay.x = -mapSize.x/2;
    mapOverlay.y = -mapSize.y/2;
    mapOverlay.width = mapSize.x;
    mapOverlay.height = mapSize.y;

    // Draw a bounding rectangle
    const border = new Pixi.Graphics();
    border.lineStyle({width: 10, color: '0x00ff00'});
    border.drawRect(0,0,mapSize.x,mapSize.y);
    // mapOverlay.addChild(border);
    mapOverlay.filters = [new Pixi.filters.BlurFilter(16)];

    window.mapOverlay = mapOverlay;

    const svgScale = (mapSize.x/1428)*1.017;
    const svgOffset = { x: -55, y: 822 }

    const sectors2 = await fetch('./test_sectors2.svg').then(data => data.text());
    const svgData = canvasUtilities.svgToData(sectors2);
    console.log(svgData);

    mapOverlay.alpha = 0.00;
    await Promise.all(svgData.shapes.map(async (shape) => {
      console.log(shape);
      const newShape = new Pixi.Graphics();
      newShape.lineStyle({width: 90, color: shape.type === 'path' ? '0x0000ff' : '0x0000ff'});
      newShape.alpha = 0.7;
      canvasUtilities.scaleAndOffsetShape(shape, { x: svgScale, y: svgScale }, svgOffset);
      await canvasUtilities.drawPixiGraphicFromSvgData(shape, newShape);

      await mapOverlay.addChild(newShape);

    }));
    mapOverlay.alpha = 0.1;

    // Apply hit area and event handler
    await helpers.timeout(100);
    mapOverlay.updateHitArea();

    await Promise.all(mapOverlay.children.map(sector => {
      // console.log(sector);
      // console.log(sector.geometry.points);
      sector.interactive = true;
      const poly = new Pixi.Polygon(...sector.geometry.points);
      console.log(poly);
      sector.hitArea = poly;
      const fadein = (sector) => {
        sector.fading = 'in';
        const fadeout = (sector) => {
          console.log('out');
          sector.fading = 'out';
          let fadingOut = setInterval(() => {
            if (sector.fading === 'in' || sector.alpha <= 0) {
              clearInterval(fadingOut);
              sector.off('mouseout', () => fadeout);
            }
            else sector.alpha = helpers.bound(sector.alpha - 0.008, 0, 1);
          });
        }
        sector.on('mouseout', () => fadeout(sector));
        let fadingIn = setInterval(() => {
          if (sector.fading === 'out' || sector.alpha >= 1) clearInterval(fadingIn);
          else sector.alpha = helpers.bound(sector.alpha + 0.008, 0, 1);
        });
      }
      sector.on('mouseover', () => fadein(sector));
      sector.alpha = 0;
    }));
    mapOverlay.alpha = 1;



    // const testSectors = helpers.svgStringToData(testSvgData);
    // console.log(testSectors);

    // const testCss = `.testpath { fill:none; stroke:#999999; stroke-width: 8px; }`,
    //   testStyle = `fill:none; stroke:#ffffff; stroke-width: 8px;`;
    // const testAttributes = `id="sectors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1428 1294" width="1428"`;



    // const testFragment = document.createDocumentFragment();

    // const addSvgFragment = (path, svgAttributes = testAttributes) => {
    //   const newSvg = document.createElement('template');
    //   newSvg.innerHTML = `
    //   <svg ${svgAttributes}>
    //     <${path.type} class="${path.class}" points="${path.points||''}" d="${path.d||''}"/>
    //   </svg>`;
    //   newSvg.content.firstElementChild.style = testStyle;
    //   newSvg.content.firstElementChild.id = path.id || 'newpath';
    //   testFragment.append(newSvg.content.firstElementChild);
    // }
    // const mapVectorTransform = async (svgElement, vectorScale = 1.018, offsetPosition = { x: 20, y: 20 }, spriteAnchor = 0.5) => {
    //   const prefix = `data:image/svg+xml;base64,`,
    //     svgString = svgElement.outerHTML;
    //   // console.log(svgString);
    //   const svg64 = `${prefix}${btoa(svgString)}`;
    //   // console.log(svg64);
    //   const svgRes = new Pixi.SVGResource(svg64, {
    //     width: vectorScale*(mapSize.x/8),
    //   });
    //   const newTex = await new Pixi.Texture.from(svgRes);
    //   // console.log(newTex);
    //   const newSprite = await new Pixi.Sprite(newTex);
    //   // console.log(newSprite);
    //   newSprite.scale.set(8);
    //   newSprite.position = (offsetPosition);
    //   newSprite.anchor.set(spriteAnchor);
    //   newSprite.tint = '0xff0000';
    //   // sprite1 = window.newsprite;
    //   return newSprite;
    // }

    // testSectors.paths.forEach(path => addSvgFragment(path));
    // // addSvgFragment(testSectors.paths[1]);
    // console.log(testFragment);

    // window.fragment = testFragment;


    // console.log(`SVG scale might be ${window.svgScale}`);

    // let svgArray = Array.from(testFragment.children);
    // console.log(svgArray);
    // const spriteList = [];
    // for (let i = 0; i < svgArray.length; i++) {
    //   spriteList.push(await mapVectorTransform(svgArray[i]));
    //   await helpers.timeout(50);
    // }
    // console.log(spriteList);

    
    // window.mapSize = mapSize;
    // window.mapOverlay = mapOverlay;
    // window.tok = window.Dune.layers.token;
    // window.graph = new Pixi.Graphics();
    // window.points = Array.from(window.fragment.firstElementChild.firstElementChild.points).reduce((acc,p) => acc.concat(p.x*svgScale,p.y*svgScale), []);
    // window.mapOverlay.addChild(window.graph);
    // window.graph.lineStyle({width: 100, color: '0x00ff55'});
    // window.graph.position = svgOffset;
    // window.graph.drawPolygon(window.points);
    // for (const key in testSvg) {
    //   // if (/^sprite/.test(key)) mapOverlay.addChild(testSvg[key]);
    // }
    // mapOverlay.addChild(testSprite);
    // window.Dune.layers.token.addChild(testSprite);
    // mapOverlay.addChild(testSvg.sprite1);
    // window.Dune.layers.background.getChildByName('mapOverlay').addChild(...spriteList);
    // await helpers.timeout(1000);
    // for (let i = 0; i < spriteList.length; i++) {
    //   mapOverlay.addChild(spriteList[i]);
    //   await helpers.timeout(100);
    // }
    // spriteList[0].on('mouseenter', () => {
    //   console.log('blah');
    //   spriteList[0].tint = `0x00ff00`;
    // });
    // Send ack to server for playerReady
    if (data.ack?.name) { renHub.trigger(`server/${data.ack.name}`); }

    // DRAW UI - HOUSE LIST FROM HOUSE DATA
    // PLACE TOKENS
    // PLACE CARD DECKS
  }

  // Initial load to set up Pixi app & stage
  static async initCanvas() {
    // Initialise Pixi app
    const windowSize = {width: window.screen.availWidth, height: window.screen.availHeight};
    const pixiApp = new Pixi.Application({
      width: windowSize.width,
      height: windowSize.height,
      backgroundColor: this.backgroundColor
    });
    await helpers.watchCondition(() => $('#canvas'));
    $('#canvas').append(pixiApp.view);
    // Set up Stage & main Layers

    

    window.Dune.layers.stage = pixiApp.stage;
    window.Dune.layers.stage.scale = { x: 0.17, y: 0.17 };

    // SET UP LAYERS
    const backgroundLayer = new Layer(pixiApp.stage, 'background');
    backgroundLayer.sortableChildren = true;
    
    const tokenLayer = new Layer(pixiApp.stage, 'token');
    tokenLayer.sortableChildren = true;
    this.#initCanvasHandlers();
    // Load UI extensions now
    PixiUiExtension.init();
    return 1;
  }

}