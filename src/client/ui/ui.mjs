// UI rewrite, no jquery
export const initUi = async () => {
	devContextMenu();
}

const devContextMenu = () => {
	window.document.addEventListener('mouseup', (ev) => {
		if (ev.shiftKey && ev.button === 2) {
			let pos = { x: ev.clientX, y: ev.clientY }
			// TODO:create menu!
			window.Dune?.renHub.trigger('main/inspectElement', pos);
		}
	})
}