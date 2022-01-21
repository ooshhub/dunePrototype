// UI rewrite, no jquery

import { renHub } from '../rendererHub.mjs';

export const initUi = async () => {
	devContextMenu();
}

const devContextMenu = () => {
	window.document.addEventListener('mouseup', (ev) => {
		if (ev.shiftKey && ev.button === 2) {
			let pos = { x: ev.clientX, y: ev.clientY }
			// TODO:create menu!
			renHub.trigger('main/inspectElement', pos);
		}
	})
}