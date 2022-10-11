import { slog } from "../../serverHub.mjs";

export class BaseService {

  constructor(serviceData = {}) {
    this.logger = slog;
    this.name = serviceData.name || 'newService';
  }

  all() { throw new Error(`${this.name} does not implement all()!`); }

}