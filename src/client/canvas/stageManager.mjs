/* globals */

// Primary Pixi.js handler
import * as Pixi from './lib/pixi.mjs';
import { Layer } from './viewModels/backgroundClasses.mjs';
import { OverlayContainer, OverlayLayer } from './overlay/OverlayClasses.mjs';
import { renHub, rlog, frameControl, rendererHub } from '../app.mjs';
import { Helpers } from '../../shared/Helpers.mjs';
import { PixiUiExtension } from './pixiUi.mjs';
import { fetchAssetPath } from '../../assets/assetDirectory.mjs';
// import { CanvasUtilities as canvasUtilities } from './CanvasUtilities.mjs';

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
        this.Textures = Helpers.unFlattenObjectPaths(output);
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
    const flattenedAssets = Helpers.flattenObjectPaths(defaultAssets);
    for (const asset in flattenedAssets) this.pixiLoader.add(asset, flattenedAssets[asset]);
  }

  static async #setupMapOverlay(mapDimensions) {

    // TODO: get scale from SVG file
    const svgOffset = { x: -55, y: 822 }
    const svgScale = (mapDimensions.x/1428)*1.017;

    // Setup overlay container
    const mapOverlay = new OverlayContainer({
      name: `mapOverlay`,
      x: -mapDimensions.x/2,
      y: -mapDimensions.y/2,
      parentLayer: window.Dune.layers.background,
      propagateEvents: true,
    });
    mapOverlay.alpha = 0.1;
    mapOverlay.filters = [new Pixi.filters.BlurFilter(8)];


    const mapOverlays = {
      sectors: {
        svg: '../canvas/overlay/overlay_sectors.svg',
        color: '0x22dd00',
        width: 90,
        alpha: 0.7
      },
      subRegions: {
        svg: '../canvas/overlay/overlay_subRegions.svg',
        color: '0x0022ee',
        width: 90,
        alpha: 0.7
      },
      regions: {
        svg: '../canvas/overlay/overlay_regions.svg',
        color: '0xff5555',
        width: 90,
        alpha: 0.7
      },
    }
    
    for (const overlay in mapOverlays) {
      // Process SVG from file
      const svgText = await fetch(mapOverlays[overlay].svg).then(data => data.text());
      const newOverlay = new OverlayLayer({
        name: overlay,
        svgTextStream: svgText,
        parentContainer: mapOverlay,
        stroke: {
          width: mapOverlays[overlay].width,
          color: mapOverlays[overlay].color,
        },
        fill: {
          color: mapOverlays[overlay].color,
        },
        alpha: mapOverlays[overlay].alpha ?? 1,
        tint: mapOverlays[overlay].tint ?? null,
        scale: { x: svgScale, y: svgScale },
        offset: { x: svgOffset.x, y: svgOffset.y }
      });
  
      await Helpers.timeout(200);

      // Create hit area polygons for all vectors in layer
      newOverlay.createHitPolygons();
      newOverlay.registerMouseoverEvents();
    }

    await Helpers.timeout(250);
    window.mapOverlay = mapOverlay;
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
    // await Helpers.animationFrameBreak();
    await Helpers.timeout(500);
    await Helpers.animationFrameBreak();
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
    await Helpers.watchCondition(() => $('#canvas'));
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