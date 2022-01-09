/* globals Dune */

// Primary Pixi.js handler
import * as pixi from './lib/pixi.mjs';
import { Layer, /* Background,*/ /* AnchorPoint */ } from './viewModels/tiles.mjs';
import { renHub, rlog } from '../rendererHub.mjs';

const backgroundColor = 0xb4b4b4;
// const rlog = window.Dune

export const initCanvas = async () => {
	// Initialise Pixi app
	rlog('Init Pixi canvas');
	const windowSize = {width: window.screen.availWidth, height: window.screen.availHeight};
	const pixiApp = new pixi.Application({
		width: windowSize.width,
		height: windowSize.height,
		backgroundColor: backgroundColor
	});
	await window.Dune.Helpers.watchCondition(() => $('#canvas'));
	$('#canvas').append(pixiApp);
	// Set up Stage & main Layers
	Dune.Layers.Stage = pixiApp.stage;
	// SET UP LAYERS
	let backgroundLayer = new Layer(pixiApp.stage, 'Background');
	let tokenLayer = new Layer(pixiApp.stage, 'Token');
	tokenLayer.sortableChildren = true;
	backgroundLayer.filters = [new pixi.filters.BlurFilter(2)];

	return 1;
}