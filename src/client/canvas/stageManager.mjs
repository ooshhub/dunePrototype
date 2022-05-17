/* globals */

// Primary Pixi.js handler
import * as Pixi from './lib/pixi.mjs';
import { Layer, /* Background,*/ /* AnchorPoint */ } from './viewModels/tiles.mjs';
import { renHub, rlog, frameControl, rendererHub } from '../app.mjs';
import { helpers } from '../../shared/helpers.mjs';
import { PixiUiExtension } from './pixiUi.mjs';
import { fetchAssetPath } from '../../assets/assetDirectory.mjs';
import { CanvasUtilities as canvasUtilities } from './CanvasUtilities.mjs';

window.PIXI = Pixi;

// Enable DEBUG MENU
const enableDebugMenu = 1;

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

  static async #setupMapOverlay(mapDimensions) {

    // Setup overlay container
    const mapOverlay = new Layer(window.Dune.layers.background, 'mapOverlay', true);
    mapOverlay.x = -mapDimensions.x/2;
    mapOverlay.y = -mapDimensions.y/2;
    mapOverlay.width = mapDimensions.x;
    mapOverlay.height = mapDimensions.y;
    mapOverlay.alpha = 0.1;
    mapOverlay.filters = [new Pixi.filters.BlurFilter(16)];

    mapOverlay.updateHitArea();

    // TODO: get scale from SVG file
    const svgOffset = { x: -55, y: 822 }
    const svgScale = (mapDimensions.x/1428)*1.017;
    const mapOverlays = {
      sectors: {
        svg: '../canvas/overlay/overlay_sectors.svg',
        tint: '0x33ff88',
      },
      subRegions: {
        svg: '../canvas/overlay/overlay_subRegions.svg',
        tint: '0x0055ff',
      },
      regions: {
        svg: '../canvas/overlay/overlay_regions.svg',
        tint: '0xff5555',
      },
    }
    
    for (const overlay in mapOverlays) {
      // Process SVG from file
      const svgTextStream = await fetch(mapOverlays[overlay].svg).then(data => data.text());
      const svgData = canvasUtilities.svgToData(svgTextStream, { useNameIndex: false });
      console.log(svgData);

      // Create subcontainer
      const subOverlay = new Layer(mapOverlay, overlay, true);
      subOverlay.interactiveChildren = false;
      subOverlay.interactive = true;
      // subOverlay.alpha = 0.1;
  
      // Create a Graphic for each shape & draw
      await Promise.all(svgData.shapes.map(async (shape,i) => {
        // console.log(shape);
        const newShape = new Pixi.Graphics();
        newShape.name = shape.name ?? `noname-${i}`;
        // TODO: change to white line with tint
        newShape.lineStyle({width: 90, color: mapOverlays[overlay].tint });
        newShape.alpha = 0.7;
        canvasUtilities.scaleAndOffsetShape(shape, { x: svgScale, y: svgScale }, svgOffset);
        await canvasUtilities.drawPixiGraphicFromSvgData(shape, newShape);
  
        await subOverlay.addChild(newShape);  
      }));
  
      await helpers.timeout(100);
      // mapOverlay.updateHitArea();

      // Apply hit area and event handlers
      await Promise.all(subOverlay.children.map(overlayShape => {
        // console.log(sector);
        // console.log(sector.geometry.points);
        overlayShape.interactive = true;
        const poly = new Pixi.Polygon(...overlayShape.geometry.points);
        poly.name = overlayShape.name;
        // console.log(poly);
        overlayShape.hitArea = poly;
        const fadein = (sector) => {
          sector.fading = 'in';
          const fadeout = (sector) => {
            // console.log('out');
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
        overlayShape.on('mouseover', () => fadein(overlayShape));
        overlayShape.on('click', (ev) => console.log(ev.target.name, ev.target));
        overlayShape.alpha = 0;
      }));
      // subOverlay.updateHitArea();
    }

    await helpers.timeout(250);
    return mapOverlay;
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

    const mapSize = { x: map.width, y: map.height };

    const mapOverlay = await this.#setupMapOverlay(mapSize);
    mapOverlay.alpha = 1;
    mapOverlay.updateHitArea();
    // window.Dune.layers.background.addChild(mapOverlay);

    window.mapOverlay = mapOverlay;


    // Use requestAnimationFrame to wait for board to finish drawing
    // await helpers.animationFrameBreak();
    await helpers.timeout(500);
    await helpers.animationFrameBreak();
    // Fade main sections, then remove loading modal

    if (enableDebugMenu) rendererHub.trigger('loadDebugMenu');

    await frameControl.showElements(['main#gamecanvas', 'main#gameui'], 'slow');

    renHub.trigger('loadComplete:setupBoard');
    window.Dune.session.update('GAME');

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