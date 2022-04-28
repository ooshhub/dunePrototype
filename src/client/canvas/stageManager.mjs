/* globals */

// Primary Pixi.js handler
import * as Pixi from './lib/pixi.mjs';
import { Layer, /* Background,*/ /* AnchorPoint */ } from './viewModels/tiles.mjs';
import { renHub, rlog } from '../rendererHub.mjs';
import { helpers } from '../../shared/helpers.mjs';
import { PixiUiExtension } from './pixiUi.mjs';
import { fetchAssetPath } from '../../assets/assetDirectory.mjs';

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
    // Move this later
    window.Dune.session.update('GAME');
    renHub.trigger('fadeElement', ['#mainmenu', '#lobby', '#mentat-lobby'], 'out', 1);

    // set up Sprite asset list and build Texture data
    rlog([`stageManager setting up board from data: `, setupData]);
    await this.buildAssetList();
    await this.spriteLoader();
    // rlog(this.Textures);

    // Draw & position the Board
    const stage = window.Dune.layers.stage,
      map = new Pixi.Sprite(this.Textures.map);
    map.anchor.set(0.5);
    stage.position = { x: stage.x + (map.width/2*stage.scale.x), y: stage.y + (map.height/2*stage.scale.y) }
    window.Dune.layers.background.addChild(map);

    // Use requestAnimationFrame to wait for board to finish drawing
    await helpers.animationFrameBreak();
    renHub.trigger('showElement', '#gamecanvas');

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
    /* let backgroundLayer =  */new Layer(pixiApp.stage, 'background');
    let tokenLayer = new Layer(pixiApp.stage, 'token');
    tokenLayer.sortableChildren = true;
    // backgroundLayer.filters = [new Pixi.filters.BlurFilter(2)];
    this.#initCanvasHandlers();
    // Load UI extensions now
    PixiUiExtension.init();
    return 1;
  }

}