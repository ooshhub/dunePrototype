// background, maps and such
import * as pixi from '../lib/pixi.mjs';

export class Layer extends pixi.Container {
	constructor(stageLayer, name, allowEvents) {
		let newLayer = super();
		Object.assign(newLayer, {
			width: window.innerWidth, 
			height: window.innerHeight,
			interactive: allowEvents,
			hitArea: allowEvents ? new pixi.Rectangle(0, 0, window.innerWidth, window.innerHeight) : null
		});
		Object.assign(this, newLayer);
		stageLayer.addChild(this);
		window.Dune.Layers[name] = this;
	}
}