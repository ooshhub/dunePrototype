// background, maps and such
import * as Pixi from '../lib/pixi.mjs';
import { helpers } from '../../../shared/helpers.mjs';
import { CanvasUtilities as canvasUtilities } from '../CanvasUtilities.mjs';

export class MapVector extends Pixi.Graphics {

  constructor(shapeData, overlayData) {
    super();
    this.name = shapeData.name ?? `newVector-${shapeData.index??'0'}`;
    this.lineStyle({width: overlayData.stroke.width ?? 10, color: overlayData.stroke.color });
    canvasUtilities.scaleAndOffsetShape(shapeData, overlayData.svgScale ?? { x: 1, y: 1 }, overlayData.svgOffset ?? { x: 0, y: 0 });
    canvasUtilities.drawPixiGraphicFromSvgData(shapeData, this);
  }

  createHitArea() {
    if (!this.geometry.points?.length) return console.warn(`${this.name}: Couldn't find geometry points.`);
    this.hitArea = new Pixi.Polygon(...this.geometry.points);
  }

  applyMouseoverEvents() {
    this.interactive = true;
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
    this.on('mouseover', () => fadein(this));
    this.on('click', (ev) => console.log(ev.target.name, ev.target));
    this.alpha = 0;
  }

}

export class OverlayLayer extends Pixi.Container {

  constructor(overlayData) {
    super();
    // Process SVG from text stream
    if (!overlayData.svgTextStream) {
      console.error(`${this.constructor.name}: SVG data must be supplied to constructor`);
      return {};
    }
    Object.assign(this, {
      name: overlayData.name ?? `newOverlay`,
      interactiveChildren: false,
      interactive: false,
    });
    const svgData = canvasUtilities.svgToData(overlayData.svgTextStream, { useNameIndex: false });
    console.log(svgData);
    // Convert SVG shapes to Pixi graphics
    svgData.shapes.map(async (shape, i) => {
      // console.log(shape);
      shape.index = i;
      this.addChild(new MapVector(shape, overlayData));
    });
    if (overlayData.parentContainer) overlayData.parentContainer.addChild(this);
  }

  createHitPolygons() {
    this.children.forEach(child => {
      if (child.createHitArea) child.createHitArea();
    });
  }

  registerMouseoverEvents() {
    this.children.forEach(child => {
      if (child.applyMouseoverEvents) child.applyMouseoverEvents();
    });
  }

  checkClick(eventData) {
    console.log(`${this.name}: Checking ${this.children.length} for click event...`, eventData);
  }
}

export class OverlayContainer extends Pixi.Container {

  #propagateEvents = false;

  constructor(containerData) {
    super();
    Object.assign(this, {
      name: containerData.name || 'newOverlayContainer',
      interactive: false,
      width: containerData.width ?? 0,
      height: containerData.height ?? 0,
      position: {
        x: containerData.x,
        y: containerData.y,
      }
    });
    if (containerData.parentLayer) containerData.parentLayer.addChild?.(this);
    if (containerData.propagateEvents) {
      this.propagateEvents = true;
      this.#propagateClick();
    }
  }

  #propagateClick() {
    this.on('click', (ev) => {
      const clone = helpers.cloneObject(ev);
      console.log(`${this.name}: Click event`, clone);
      this.children.forEach(child => child.checkClick(clone));
    });
  }

  updateHitArea() {
    const bounds = this.getLocalBounds();
    this.hitArea = new Pixi.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  }

}

export class Layer extends Pixi.Container {
  constructor(parentLayer, name, allowEvents) {
    const newLayer = super();
    Object.assign(newLayer, {
      name: name,
      width: window.innerWidth, 
      height: window.innerHeight,
      interactive: allowEvents ?? true,
      sortableChildren: true,
      // hitArea: allowEvents ? new Pixi.Rectangle(0, 0, window.innerWidth, window.innerHeight) : null
    });
    Object.assign(this, newLayer);
    if (parentLayer) {
      parentLayer.addChild(this);
      if (parentLayer.parent === null) {
        window.Dune.layers[name] = this;
      }
    }
  }

  updateHitArea() {
    const bounds = this.getLocalBounds();
    this.hitArea = new Pixi.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  }
}