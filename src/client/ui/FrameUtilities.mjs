export class FrameUtilities {

  constructor() { throw new Error(`${this.constructor.name} cannot be instantiated.`) }

  // Resolve a single or array of selectors or HTML objects into an array of HTML objects
  static resolveSelectors(elementSelectors, selectAll) {
    elementSelectors = Array.isArray(elementSelectors) ? elementSelectors : [elementSelectors];
    return elementSelectors.reduce((collection, element) => {
      if (typeof(element) === 'object' && element?.tagName) collection.push(element);
      else if (typeof(element) === 'string') {
        let output = (selectAll) ? Array.from(document.querySelectorAll(element)) : [document.querySelector(element)].filter(v=>v);
        if (output && output.length !== 0) collection.push(...output)
        else this.logger(`${this.constructor.name} Error: selector "${element}" returned no results.`);
      }
      return collection;
    }, []);
  }

  static bringToFront(targetElement, siblingFilter='*') {
    const target = this.resolveSelectors(targetElement);
    if (!target) return console.warn(`No target element found for selector "${targetElement}"`);
    const zArray = this.getSiblingZindices(target, siblingFilter);
    target.style['z-index'] = (Math.max(...zArray) || 0) + 1;
  }

  static getSiblingZindices(targetElement, siblingFilter='*') {
    const parent = typeof(targetElement) === 'object' && targetElement.tagName ? targetElement.parentNode
      : typeof(targetElement) === 'string' ? document.querySelector(targetElement)?.parentNode
      : null;
    if (!parent) {
      console.warn(`Invalid target element:`, targetElement);
      return [];
    }
    const siblings = parent.querySelectorAll(siblingFilter) || [];
    return Array.from(siblings).map(el => {
      const style = window.getComputedStyle(el);
      return parseInt(style.getPropertyValue('z-index')) || 0;
    });
  }

  static dragElement(dragTarget, dragHandle, options={}) {

    const target = typeof(dragTarget) === 'object' && dragTarget.tagName  ? dragTarget : document.querySelector(dragTarget),
      handle = dragHandle ? typeof(dragHandle) === 'object' && dragHandle.tagName ? dragHandle : document.querySelector(dragHandle) : target;

    let dragOptions = {
        bound: options.bound ?? true, // set to false to disable binding the draggabale element to the container
        boundingElement: options.boundingElement||document.documentElement,
        mouseButtons: options.mouseButtons||[1] // mouse buttons to allow for drag
    }
    let posXi = 0, posXf = 0, posYi = 0, posYf = 0;
    let minX, minY, maxX, maxY;
    let boundWidth, boundHeight;
    let finalLTRB = [null,null,null,null]; // left, top, right, bottom

    const getBounds = () => {
        boundWidth = dragOptions.boundingElement.clientWidth;
        boundHeight = dragOptions.boundingElement.clientHeight;        
        minX = 0, minY = 0, maxX = boundWidth - target.offsetWidth, maxY = boundHeight - target.offsetHeight;
        // console.info(minX, minY, maxX, maxY);
    }

    const elementGrab = (ev) => {
        ev.preventDefault();
        if (dragOptions.bound) getBounds();
        posXi = ev.clientX;
        posYi = ev.clientY;
        document.addEventListener('mouseup', elementRelease);
        document.addEventListener('mousemove', elementDrag);
    }

    const elementDrag = (ev) => {
        ev.preventDefault();
        target.dataset.dragging = true;
        posXf = posXi - ev.clientX;
        posYf = posYi - ev.clientY;
        posXi = ev.clientX;
        posYi = ev.clientY;

        finalLTRB[0] = dragOptions.bound ? Math.min(Math.max((target.offsetLeft - posXf), minX), maxX) : target.offsetLeft - posXf;
        finalLTRB[1] = dragOptions.bound ? Math.min(Math.max((target.offsetTop - posYf), minY), maxY) : target.offsetTop - posYf;
        Object.assign(target.style, { left: `${finalLTRB[0]}px`, top: `${finalLTRB[1]}px` });
    }

    const elementRelease = () => {
      document.removeEventListener('mousemove', elementDrag);
      document.removeEventListener('mouseup', elementRelease);
      setTimeout(() => {
        target.dataset.dragging = false;
      }, 500);
    }

    handle.addEventListener('mousedown', (ev) => {if (dragOptions.mouseButtons.includes(ev.which)) elementGrab(ev)});
  } 
}