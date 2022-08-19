// Extra UI functionality for the canvas
import { Helpers } from "../../shared/Helpers.mjs";

export class PixiUiExtension {

  constructor() { throw new Error(`${this.constructor.name} cannot be instantiated.`) }

  static init() {
    const canvasView = document.querySelector('#canvas');
    this.#canvasZoom(canvasView);
    this.#panView(canvasView);
  }

  static #canvasZoom(element) {
    const frame = window.Dune.layers.stage;
    const scaleBounds = { min: 0.10, max: 0.60 } 
    element.addEventListener('wheel', ev => {
      ev.preventDefault();
      // console.log(frame.scale, scale);
      let scale = Helpers.bound(frame.scale.x -= (ev.deltaY/3500), scaleBounds.min, scaleBounds.max);
      // console.log(scale);
      const initialPos = { x: frame.x, y: frame.y };
      const initialScale = { x: frame.scale.x, y: frame.scale.y }
      // console.log(`Initial`, initialPos);
      const initialPixels = { x: window.innerWidth/initialScale.x, y: window.innerHeight/initialScale.y },
        finalPixels = { x: window.innerWidth/scale, y: window.innerHeight/scale },
        pixelDiff = { x: - initialPixels.x + finalPixels.x, y: - initialPixels.y + finalPixels.y },
        offset = { x: (ev.clientX - window.innerWidth/2)*0.1, y: (ev.clientY - window.innerHeight/2)*0.1 },
        bump = { x: (pixelDiff.x-offset.x)/2*(scale**2), y: (pixelDiff.y-offset.y)/2*(scale**2) };
        // offset = { x: (ev.clientX - window.innerWidth/2)*0.1, y: (ev.clientY - window.innerHeight/2)*0.1 };
      const finalPos = { x: initialPos.x + bump.x - offset.x, y: (initialPos.y + bump.y - offset.y) }
      // console.log(`Final`, finalPos);
      frame.scale = {x: scale, y: scale}
      frame.position = finalPos;
    });
  }

  static #panView(element) {
    const frame = window.Dune.layers.stage;
    element.addEventListener('mousedown', ev => {
      if (ev.button === 2) {
        let pos = {x: ev.clientX, y: ev.clientY};

        const panView = (ev) => {
          let delta = {x: (ev.clientX - pos.x)/1, y: (ev.clientY - pos.y)/1};
          frame.position.x = frame.position.x + delta.x;
          frame.position.y = frame.position.y + delta.y;
          pos = {x: ev.clientX, y: ev.clientY};
        }

        element.addEventListener('mousemove', panView);

        document.addEventListener('mouseup', () => {
          element.removeEventListener('mousemove', panView);
        });
    }
    });
  }

}