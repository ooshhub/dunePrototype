import { FrameUtilities as utilities } from "./FrameUtilities.mjs";
import { rendererHub } from "../app.mjs";

const debugInit = (() => { //eslint-disable-line

  const debugSelector = '#gameui #debug-menu';
  const debug = document.querySelector(debugSelector);

  rendererHub.trigger('showElements', debug);

  if (!debug) return console.error(`Couldn't find debug menu in DOM`);

  const addControl = (selector, event, handler, destroy) => {
    const target = debug.querySelector(selector);
    if (destroy) target.removeEventListener(event, handler);
    else target.addEventListener(event, handler);
  }

  // resize, minimise, drag
  utilities.dragElement(debug, debug.querySelector('header'));
  
  // button and select handlers
  addControl('select.map-overlay', 'change', (ev) => {
    const newOverlay = ev.target.value;
    const overlays = window.Dune.layers.background?.getChildByName('mapOverlay');
    console.log(overlays);
    overlays.children.forEach(overlay => {
      overlay.interactiveChildren = (overlay.name.toLowerCase() === newOverlay.toLowerCase()) ? true : false;
    });
  });


})();