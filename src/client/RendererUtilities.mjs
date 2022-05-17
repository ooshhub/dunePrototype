import { RendererInterfaceFunctions } from "./RendererInterfaceFunctions.mjs";
import { helpers } from "../shared/helpers.mjs";

export class RendererUtilities extends RendererInterfaceFunctions {

  constructor(parentInterface) {
    super(parentInterface);
  }
  /*
    HTML & CONFIG REQUEST
  */
  // Insert rendered HTML to game view
  async insertHtml(data) {
    const targetSelector = {
      canvas: { selector: 'main#gamecanvas'},
      ui: { selector: 'main#gameui'},
      chat: { selector: 'main#chat'},
      mainmenu: { selector: 'main#mainmenu'},
      ingamemenu: { selector: 'dialog#ingamemenu'},
      lobby: { selector: 'dialog#lobby', eventTrigger: 'initLobby' },
    }
    if (data.html && targetSelector[data.req].selector) $(targetSelector[data.req].selector).innerHTML = data.html;
    else this.rlog(data.err||`HTML request error: "${data.req}" not found.`, 'error');
    if (targetSelector[data.req].eventTrigger) this.renHub.trigger(targetSelector[data.req].eventTrigger, data);
  }
  // Update CONFIG in browser window
  updateConfig({ CONFIG }) {
    this.rlog([`Received game data: `, CONFIG]);
    window.Dune.config = CONFIG;
  }
  updatePlayerList(playerData) {
    this.rlog([`Received player list`, playerData]);
    window.Dune.update('players', playerData);
  }

   /**
   * HTML / CSS / UI
   */
  // Show / Hide / Fade one or more sections via selector strings
  async transitionSection(elements, direction, fadeTime=1000) {
    if (!/^(in|out)$/.test(direction)) return this.rlog(`transitionSection() Error: bad direction input "${direction}"`, 'warn');
    elements = helpers.toArray(elements);
    await Promise.all(elements.map(async (el) => {
      if (!$(el)) return this.rlog(`showSection(): bad selector`, 'warn');
      if (($(el).classList?.contains('show') && direction==='in') || ($(el).classList?.contains('hide') && direction==='out')) return;
      let targetCSS = window.getComputedStyle($(el));
      let oldZ = parseInt(targetCSS.getPropertyValue('z-index')) || 0;
      // this.rlog(oldZ);
      let newZ = (direction === 'in') ? 100 + oldZ : oldZ - 100;
      // this.rlog(`newz ${newZ}`);
      if (direction === 'in') {
        $(el).classList.add('show');
        $(el).classList.remove('hide');
        $(el).style['z-index'] = newZ;
      }
      if (fadeTime > 0) await this.fadeSection(el, direction, fadeTime);
      if (direction === 'out') {
        $(el).classList.add('hide');
        $(el).classList.remove('show');
        $(el).style['z-index'] = newZ;
      }
    }));
    window.Dune.session?.update(0, 'ui');
    return 1;
  }
  async fadeSection(element, direction, length=1500, timeStep = 1) {
    // this.rlog(`Fading ${direction} ${element}...`);
    let start = Date.now();
    let target = $(element);
    if (!target || !/^(in|out)$/.test(direction)) return this.rlog(`fadeSection() error: bad selector or direction, "${element}", "${direction}"`);
    target.style.opacity = direction === 'out' ? 1 : 0;
    return new Promise(res => {
      let fade = setInterval(() => {
        if ((direction === 'out' && target.style.opacity <= 0.0) ||
            (direction === 'in' && target.style.opacity >= 1.0)) {
          target.style.opacity = (direction === 'out') ? 0 : 1;
          clearInterval(fade);
          res();
        } else {
          let elapsed = Date.now() - start;
          // this.rlog([elapsed, length, elapsed/length, target.style.opacity]);
          if (direction === 'out') target.style.opacity = 1 - this.bezier(elapsed/length)//length;
          else target.style.opacity = this.bezier(elapsed/length)//length;
        }
      }, timeStep);
    });
  }
  bezier(t) {
    return t;
    // Temp DISABLE
    // let ret = t*t*(3 - 2*t);
    // return ret.toFixed(2);
  }
  


  // const initGameBoard = (data) => {

  // 	this.rendererHub.trigger('pixiSetupGameBoard');
  // 	// Move the element fade to StageManager  - fade once asset load is complete

  // }


}