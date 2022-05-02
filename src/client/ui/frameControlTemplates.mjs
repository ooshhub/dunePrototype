const resolveSelector = (targetElementOrSelector) => {
  return typeof(targetElementOrSelector) === 'object' && targetElementOrSelector.tagName ? targetElementOrSelector
  : typeof(targetElementOrSelector) === 'string' ? document.querySelector(targetElementOrSelector)
  : null;
}

const getSiblingZarray = (targetElement, siblingFilter = '.testclass') => {
  const parent = typeof(targetElement) === 'object' && targetElement.tagName ? targetElement.parentNode
    : typeof(targetElement) === 'string' ? document.querySelector(targetElement)?.parentNode
    : null;
  if (!parent) {
    console.warn(`Invalide target element:`, targetElement);
    return [];
  }
  const siblings = siblingFilter ? parent.querySelectorAll(siblingFilter)
    : parent.childNodes;
  return Array.from(siblings).map(el => {
    const style = window.getComputedStyle(el),
      z = parseInt(style.getPropertyValue('z-index')) || 0;
      console.log(z);
      return z;
  });
}

const bringToFront = (targetElement) => {
  const target = resolveSelector(targetElement);
  if (!target) return console.warn(`No target element found for selector "${targetElement}"`);
  const zArray = getSiblingZindices(target);
  target.style['z-index'] = (Math.max(...zArray) ?? 0) + 1;
}