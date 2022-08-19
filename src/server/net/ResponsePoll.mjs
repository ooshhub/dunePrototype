import { serverHub, slog } from '../serverHub.mjs';
import { Helpers } from '../../shared/Helpers.mjs';

/*
Request an acknowledgment from clients and collate responses
On success, returns a Promise containing an object with a response for each client
On timeout, returns a Promise containing an error message and a data object with partial responses & error details, if any

Basic use:

const newPoll = new ClientPoll({
  name: 'clientAck',
  uniqueMessages: true,
  targets: [houseId1, houseId2],
  poll: [message1, message2],
  ack: {
    name: 'messageReceived'
  },
  timeout: 20000
});
const results = await newPoll.send();

*/

export class ClientPoll {

  #responses = {};
  #errors = [];

  // TODO: retry is non-functinoal
  constructor(pollData={}) {
    this.id = Helpers.generateUID();
    Object.assign(this, {
      name: pollData.name || 'New ResPoll',
      byId: pollData.byId || 'hid',
      targets: Helpers.toArray(pollData.targets) || [],
      uniqueMessages: pollData.unique ?? true,
      retry: pollData.retry > 0 ? pollData.retry : 0,
      timeout: pollData.timeout > 0 ? pollData.timeout : 30000,
      poll: pollData.poll || null,
      ack: {
        name: pollData.ack?.name || 'noName',
        responseType: pollData.ack?.responseType || null,
        race: null, // define a predicate function, if it returns true the poll will end and one result kept.
      }
    });
    if (!this.targets) return new Error('Missing required field for ClientPoll, must have targets');
    if (this.uniqueMessages && !(this.targets.length <= this.poll.length)) console.warn(`Poll ${this.name} is flagged for unique messaging but doesn't have enough messages for each target. Poll will not resolve.`);
  }

  #ackListener(data) {
    const sender = data[this.byId];
    if (!sender || (this.ack.responseType && !data.ack)) {
      // TODO: response type validation when required
      this.#errors.push(`Bad poll response, no id attached or no ack:`);
      return slog([`Bad poll response, no id attached or no ack:`, data]);
    } else {
      this.#addResponse(sender, data.ack);
    }
  }

  #addResponse(sender, ack) {
    if (!this.targets.includes(sender)) {
      this.#errors.push(`Unknown responder in poll "${this.name}"`);
      return slog([`Unknown responder in poll "${this.name}":`, sender], 'warn');
    }
    if (this.#responses[sender]) {
      this.#errors.push(`Responder has already responded in "${this.name}"`)
      return slog([`Responder has already responded in "${this.name}":`, sender]);
    }
    else this.#responses[sender] = ack;
    if (Object.keys(this.#responses).filter(v=>!this.targets.includes(v)).length === 0) {
      slog(`Poll is complete.`);
      this.#finalisePoll();
    }
  }

  #finalisePoll() { serverHub.trigger(`poll${this.id}`, this.#responses) }

  // Start the request
  async send() {
    serverHub.on(this.ack.name, (...args) => { this.#ackListener(...args) });
    // Send messages to client(s) if required
    if (this.poll) {
      const messages = Helpers.toArray(this.poll);
      messages.forEach((msg,i) => {
        Object.assign(msg, {
          ack: this.ack,
          targets: msg.targets || this.targets[i], // Assign client target if missing
        });
        if (this.uniqueMessages) serverHub.trigger(`client/${this.name}`, msg);
        else serverHub.trigger(`allClients/${this.name}`, msg);
      });
    }
    // Await a result
    let result = await Promise.race([
      new Promise(res => { serverHub.once(`poll${this.id}`, (responses) => res({ res: responses })) }),
      Helpers.timeout(this.timeout)
    ]);
    // Remove handlers
    serverHub.off(`poll${this.id}`);
    serverHub.off(this.ack.name, this.#ackListener);
    return result?.res
      ? result
      : {
        err: `Poll "${this.name}" timed out.`,
        data: {
          errors: this.#errors,
          res: this.#responses
        }
      }
  }

}