// Stand-in function, replace with proper import of RendererHub
const renHub = (eventName, data) => { document.querySelector('.dunebody')?.dispatchEvent(new CustomEvent(eventName, {detail: data})) }

/* export */ const templates = {
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
          <div class="message">{%messageTop%}</div>
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
      replacers: {
        title: {
          default: 'Bingbong',
        },
        messageTop: {
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
        default: 'fc-dune',
        type: {
          validate: (v) => ['alert', 'error', 'prompt'].includes(v),
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
      closeFrame: {
        type: ['boolean'],
        default: true,
        controlButton: 'button.system.close',
        validate: (v) => {
          return (v === true || v > 0) ? true
            : (v === false || v === 0) ? false
            : null;
        }
      },
      returnData: {
        type: ['boolean'],
        default: true,
        action: (...args) => renHub('returnModalData', ...args),
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
          label: 'OK',
          name: 'ok',
        }
      ]
    }
    // `<button class="popup red">OK</button>`
  }
}

/* export */ const presets = {
  alert: {},
  prompt: {},
  error: {},
}