import { slog } from "../../serverHub.mjs";

export class BaseManager {

  constructor(managerData = {}) {
    this.name = managerData.name || 'newManager';
    this.logger = slog;
    BaseManager.logger = slog;
  }

  all() { throw new Error(`${this.name} does not implement all()!`); }

  get() { throw new Error(`${this.name} does not implement get()!`); }

  updateAndRespond() { throw new Error(`${this.name} does not implement updateAndRespond()!`); }
  
  async updateAndRespondGeneric(eventObject, thisManager) {
    const { event, data } = eventObject;
    // BaseManager.logger([event, data, thisManager])
    if (thisManager[event]) {
      // this.logger(`Found event: ${event}`);
      eventObject.response = await thisManager[event](data);
    }
    else {
      this.logger(`${this.name}: "${event}" is not a recognised event name.`);
    }
    return eventObject;
  }

}