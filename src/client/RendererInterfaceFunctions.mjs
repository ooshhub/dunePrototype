export class RendererInterfaceFunctions {

  constructor(parentInterface) {
    if (!parentInterface.rlog || !parentInterface.renHub) throw new Error(`${this.constructor.name} requires access to rlog and renHub.`);
    this.rlog = parentInterface.rlog;
    this.renHub = parentInterface.renHub;
    this.rendererHub = parentInterface.rendererHub;
    this.frameControl = parentInterface.frameControl;
    // console.log(Reflect.getPrototypeOf(this));
    const keys = Reflect.ownKeys(Reflect.getPrototypeOf(this));
    // const proto = Reflect.getPrototypeOf(this);
    // console.log(keys);
    keys.forEach(key => {
      if (typeof(this[key]) === 'function' && key !== 'constructor') {
        // console.log(`Found method: ${key}`);
        this[key] = this[key].bind(this);
      }
    });
  }

}