import { RendererInterfaceFunctions } from '../RendererInterfaceFunctions.mjs';
import { helpers } from '../../shared/helpers.mjs';
import { SocketClient } from '../net/SocketClient.mjs';

export class LobbyFunctions extends RendererInterfaceFunctions {

  constructor(parentInterface) { super(parentInterface) }

  async joinServer({ serverOptions }) {
    // this.rlog([`Joining server with options: `, serverOptions]);
    if (window.Dune.client?.io) {
      this.rlog(`Closing old Client...`);
      window.Dune.client.close()
      window.Dune.destroyClient();
      await helpers.timeout(200);
    }
    const DuneClient = new SocketClient(serverOptions);
    window.Dune.client = DuneClient;
    DuneClient.registerEventHub(this.rendererHub);
    // this.rlog([`Created socket Client`, DuneClient]);
    let connected = await DuneClient.connectToGame();
    if (!connected) this.rlog(['Connection to server failed', serverOptions], 'warn');
    else this.rendererHub.trigger('writeConfig', { path: 'net', data: { lastIp: serverOptions.hostIp, lastPort: serverOptions.hostIp }});
  }
  async setupLobby(newLobby) {
    if (window.Dune.client.clientState === 'INIT_LOBBY') {
      this.rlog([`Received fresh Lobby for setup`, newLobby], 'info');
      this.rendererHub.trigger('main/requestHtml', { req: 'lobby', data: newLobby });
      let lobbyReady = await helpers.watchCondition(() => $('#lobby header'), 'Lobby HTML found', 6000);
      if (lobbyReady) {
        this.rlog('Lobby HTML detected, bringing window up...');
        console.log(this);
        await this.frameControl.showElements('#lobby');
        this.rendererHub.trigger('loadComplete:clientLobby');
      }
    } else this.rlog('Error in host Client state, not ready for Lobby setup', 'error');
  }
  async joinLobby({ lobbyData, playerData, initFlag, houseData }) {
    this.rlog([`Received lobby data:`, lobbyData, playerData, houseData], 'info');
    // Validate data
    if (houseData) window.Dune.lobby.houses = houseData;
    this.rendererHub.trigger('main/requestHtml', { req: 'lobby', data: lobbyData });
    if (await helpers.watchCondition(() => $('.player-list'))) {
      this.rendererHub.trigger('refreshLobby', { playerData: playerData });
      await this.frameControl.showElements(['#chat', '#lobby']);
      this.rendererHub.trigger('loadComplete:clientLobby');
      window.Dune.client?.inLobby();
      window.Dune.session?.update('LOBBY');
      if (initFlag) this.rendererHub.trigger('server/hostJoined');
    } else {
      this.rlog(`Lobby failed to load`);
      // close lobby & shit
    }
  }

  async updateLobby({ serverOptions, playerData, update, canLaunch }) {
    const validKeys = ['house', 'color', 'ready'];
    this.rlog(`LAUNCH STATUS: ${canLaunch}`);
    if (!serverOptions && !playerData && !update) return this.rlog(`Bad lobby update received: no data`);
    if (serverOptions) {
      this.rlog([`Lobby update received`, serverOptions]);
      if (serverOptions.name && serverOptions.value !== null) {
        // TODO: this is duplicate code from playerData update, move to helper? Or combine paths.
        const targetInput = $(`[name=${serverOptions.name}`);
        if (targetInput.type === 'checkbox') targetInput.checked = /(0|off|false)/i.test(`${serverOptions.value}`) ? false : true;
        else targetInput.value = serverOptions.value;
      } else this.rlog(`Bad lobby update`, 'warn');
    }
    if (playerData) {
      this.rlog([`Lobby update received`, playerData]);
      Object.keys(playerData).forEach(p => {
        let targetRow = $(`.player[data-index="${p}"]`);
        this.rlog(`Inserting player into slot ${p}`);
        targetRow.querySelector('.player-name span').innerText = playerData[p].playerName || '';
        targetRow.dataset.id = playerData[p].pid || '';
        targetRow.dataset.ishost = (p == 1 && p.pid) ? '1' : '';
        validKeys.forEach(k => {
          if (playerData[p][k]) {
            let targetInput = targetRow.querySelector(`[name="${k}-${p}"]`);
            if (targetInput.type === 'checkbox') targetInput.checked = /(0|off|false)/i.test(`${playerData[p][k]}`) ? false : true;
            else if (targetInput) targetInput.value = playerData[p][k];
          }
        });
        if (playerData[p].pid === window.Dune.pid) targetRow.classList.remove('disabled');
      });
    }
    if (update) {
      this.rlog(['Lobby update received: ', update]);
      const playerIndex = update.index;
      if (playerIndex > -1) {
        for (let pKey in update.data) {
          if (validKeys.includes(pKey)) {
            let targetEl = $(`[name="${pKey}-${playerIndex}"]`);
            if (targetEl.type === 'checkbox') targetEl.checked = update.data[pKey] ? true: false;
            else if (targetEl) targetEl.value = update.data[pKey];
            else this.rlog([`Bad update data`, pKey], 'warn');
          }
        }
      }
    }
  }

  async cancelLobby() {
    // this.rlog('Exiting current lobby...');
    this.rendererHub.trigger('server/exitLobby');
    await window.Dune.client?.destroy()
      .catch(e => this.rlog(e, 'error'));
    window.Dune.destroyClient();
    window.Dune.lobby = {};
    this.frameControl.hideElements(['main#chat', '#mentat-lobby', '#lobby'], 'fast');
  }

  async destroyClient() {
    window.Dune.client?.destroy?.(); // doesnt exist yet
    window.Dune.client = null;
    window.Dune.session?.update('MENU');
  }
}