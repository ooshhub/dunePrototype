// background, maps and such
import * as Pixi from '../lib/pixi.mjs';

export class Layer extends Pixi.Container {
	constructor(parentLayer, name, allowEvents) {
		let newLayer = super();
		Object.assign(newLayer, {
			name: name,
			width: window.innerWidth, 
			height: window.innerHeight,
			interactive: allowEvents ?? true,
			sortableChildren: true,
			hitArea: allowEvents ? new Pixi.Rectangle(0, 0, window.innerWidth, window.innerHeight) : null
		});
		Object.assign(this, newLayer);
		parentLayer.addChild(this);
		window.Dune.layers[name] = this;
	}

	updateHitArea() {
		const bounds = this.getLocalBounds();
		this.hitArea = new Pixi.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
	}
}