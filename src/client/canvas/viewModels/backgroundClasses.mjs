// background, maps and such
import * as Pixi from '../lib/pixi.mjs';

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