import * as Pixi from '../lib/pixi.mjs';
import { CanvasUtilities } from '../CanvasUtilities.mjs';
import { Helpers } from '../../../shared/Helpers.mjs';

// Grandparent container for overlay layers. Enable/disable custom events from here
export class OverlayContainer extends Pixi.Container {
  #propagateEvents = {
    click: false,
    mouseover: false,
  };

  constructor(containerData) {
    super();
    Object.assign(this, {
      name: containerData.name || 'newOverlayContainer',
      interactive: true,
      width: containerData.width ?? 0,
      height: containerData.height ?? 0,
      position: {
        x: containerData.x ?? 0,
        y: containerData.y ?? 0, 
      }
    });
    if (containerData.parentLayer) containerData.parentLayer.addChild(this);
    if (containerData.propagateEvents) {
      this.#customClickEvents(this.#mapVectorClickHandler);
      this.clickEvents = true;
    }
  }

  get mouseoverEvents() { return this.#propagateEvents.mouseover }
  set mouseoverEvents(val) { this.#propagateEvents.mouseover = typeof(val) === 'boolean' ? val : this.#propagateEvents.mouseover }
  get clickEvents() { return this.#propagateEvents.click }
  set clickEvents(val) { this.#propagateEvents.click = typeof(val) === 'boolean' ? val : this.#propagateEvents.click }
  // TODO: make generic method and pass in custom handler. Register handlers so they can be removed/changed.
  #customClickEvents(handler) { if (handler) this.on('click', handler); }
  // Handler for map vector clicks to pass to every layer
  // TODO: move this out of class def
  async #mapVectorClickHandler(ev) {
    // console.info(ev);
    const point = ev.data.getLocalPosition(this);
    console.log(point);
    const allHits = await Promise.all(this.children.map(child => child.checkClick(point))).then(v => v.reduce((acc, arr) => Array.isArray(arr) ? acc.concat(...arr) : acc, []));
    console.info(allHits);
  }

  updateHitArea() {
    const bounds = this.getLocalBounds();
    this.hitArea = new Pixi.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  }
}

// Containers for different overlay effects
// TODO: provide flags for enabling & disabling custom event propagation
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
    const svgData = CanvasUtilities.svgToData(overlayData.svgTextStream, { useNameIndex: false });
    // console.log(svgData);
    // Convert SVG shapes to Pixi graphics
    svgData.shapes.map(async (shape, i) => {
      shape.index = i;
      this.addChild(new MapVector(shape, overlayData));
    });
    if (overlayData.parentContainer) overlayData.parentContainer.addChild(this);
  }

  createHitPolygons() { this.children.forEach(child => child.createHitArea?.()); }

  registerMouseoverEvents() { this.children.forEach(child => child.applyMouseoverEvents?.()); }

  async checkClick(eventPoint) {
    // console.log(`${this.name}: Checking ${this.children.length} children for click event...`, eventPoint);
    const hits = this.children.reduce((acc, vector) => {
      return (vector.hitArea.contains(eventPoint.x, eventPoint.y)) ? acc.concat(vector.name) : acc;
    }, []);
    return hits;
  }
}

export class MapVector extends Pixi.Graphics {

  constructor(shapeData, overlayData) {
    super();
    this.name = shapeData.name ?? `newVector-${shapeData.index??'0'}`;
    CanvasUtilities.scaleAndOffsetShape(shapeData, overlayData.scale ?? { x: 1, y: 1 }, overlayData.offset ?? { x: 0, y: 0 });
    this.lineStyle({ width: overlayData.stroke.width ?? 10, color: overlayData.stroke.color });
    CanvasUtilities.drawPixiGraphicFromSvgData(shapeData, this);
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
          else sector.alpha = Helpers.bound(sector.alpha - 0.008, 0, 1);
        });
      }
      sector.on('mouseout', () => fadeout(sector));
      let fadingIn = setInterval(() => {
        if (sector.fading === 'out' || sector.alpha >= 1) clearInterval(fadingIn);
        else sector.alpha = Helpers.bound(sector.alpha + 0.008, 0, 1);
      });
    }
    this.on('mouseover', () => fadein(this));
    this.on('click', (ev) => console.log(ev.target.name, ev.target));
    this.alpha = 0;
  }

}