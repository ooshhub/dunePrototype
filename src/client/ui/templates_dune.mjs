/* export */ const templates = {
  default: {
    html: `
    <div class="{%type%}">
      <header>
        <span>{%title%}</span>
        <div class="controls">
          <button class="system close">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </header>
      <div class="body">
        <section class="top">
          <div class="message {%type%}">{%messageTop%}</div>
        </section>
        <section class="bottom">
          <div class="modal-icon">{%icon%}</div>
          <div class="message {%type%}">{%messageBottom%}</div>
        </section>
      </div>
      <footer>
      </footer>
    </div>
    `,
    properties: {
      replacers: {
        type: {
          validate: (v) => ['alert', 'error', 'prompt'].includes(v),
          default: 'alert',
        },
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
        default: (ev) => {
          console.log(ev);
          const parentFrame = ev.target.closest('.fc-dune');
          if (parentFrame) parentFrame.remove();
        }
      },
      label: {
        type: ['string'],
        validate: (v) => v,
        default: 'OK'
      },
      closeFrame: {
        type: ['boolean'],
        default: true,
        target: this.properties.classes.default,
        validate: (v) => {
          return (v === true || v > 0) ? true
            : (v === false || v === 0) ? false
            : null;
        }
      },
      returnData: {

      }
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
        }
      ]
    }
    // `<button class="popup red">OK</button>`
  }
}