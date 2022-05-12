// Template Engine template & presets for Dune
export const templates = {
  default: {
    html: `
    <div>
      <header>
        <span>{%title%}</span>
        <div class="controls">
          <button class="system close" name="close">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </header>
      <div class="body">
        <section class="top">
          <div class="message">{%message%}</div>
        </section>
        <section class="bottom">
          <div class="modal-icon">{%icon%}</div>
          <div class="message">{%messageBottom%}</div>
        </section>
      </div>
      <footer>
      </footer>
    </div>
    `,
    properties: {
      // Whether or not the close button appears top right
      closeFrame: {
        type: ['boolean'],
        default: true,
        controlButton: 'button.system.close',
        validate: (v) => {
          return (v === true || v > 0) ? true
            : (v === false || v === 0) ? true
            : null;
        }
      },
      replacers: {
        title: {
          default: 'Bingbong',
        },
        message: {
          default: `There's an alert going on.`,
        },
        messageBottom: {
          default: '',
        },
        icon: {
          default: '',
          transform: (v) => `<img src="${v}"/>`
        }
      },
      attributes: {},
      classes: {
        root: 'fc-dune-modal',
        default: '',
        type: {
          validate: (v) => ['alert', 'error', 'prompt', 'loading'].includes(v),
          default: 'alert',
        }, 
      },
      dataset: {}
    },
    buttons: {
      // Optional, replace innerHTML
      html: null,
      container: 'footer',
      // Standard properties
      action: {
        type: ['function'],
      },
      label: {
        type: ['string'],
        validate: (v) => v,
        default: 'OK'
      },
      returnData: {
        type: ['boolean'],
        default: true,
      },
      // HTML attributes
      attributes: {
        value: {
          type: ['string', 'number'],
          validate: (v) => v != null,
          default: '',
        },
        name: {
          type: ['string'],
          default: 'btn',
        },
      },
      // Classes
      classes: {
        default: 'fc-modal',
        color: {
          type: 'string',
          validate: (v) => ['red', 'green', 'blue'].includes(v),
          default: 'blue'
        }
      },
      // Dataset properties
      dataset: {},
      replacers: {},
      defaultButtons: [
        {
          label: 'Ok',
          name: 'ok',
        }
      ]
    }
  }
}

export const presets = {
  alert: {
    title: `Alert`,
    message: `Alert message`,
    buttons: [
      {
        label: 'Ok',
        name: 'ok',
        color: 'blue',
        returnData: false,
      }
    ],
  },
  prompt: {
    awaitInput: true,
    title: `Prompt`,
    disableMain: true,
    blurMain: false,
    message: `Input required.`,
    buttons: [
      {
        label: 'Ok',
        name: 'ok',
        color: 'green',
        returnData: true,
      },
      {
        label: 'Cancel',
        name: 'cancel',
        color: 'red',
        returnData: false,
      }
    ],
  },
  error: {
    title: `Error`,
    message: `Error message`,
    icon: `./assets/humanShit.png`,
    buttons: [
      {
        label: 'Ok',
        name: 'ok',
        color: 'red',
        returnData: false,
      }
    ],
  },
  loading: {
    title: `Loading`,
    draggable: false,
    disableMain: true,
    message: `Loading message`,
    icon: `./assets/doubleRing.svg`,
    buttons: [],
    closeFrame: false,
  },
}