const SVG_NS = "http://www.w3.org/2000/svg";

export function removeChildren(elem) {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
}

export function animateElem(elem, { x = 0, y = 0 }, seconds = 0.8) {
  requestAnimationFrame(() => {
    // immediately move to (x,y) offset
    elem.style.transform = `translate(${x}px, ${y}px)`;
    elem.style.transition = "transform 0s";

    requestAnimationFrame(() => {
      // return to the original position over the course of `seconds`
      elem.style.transform = "";
      elem.style.transition = `transform ${seconds}s`;
    });
  });
}

export const makeSvgGroup = () => document.createElementNS(SVG_NS, "g");

export function makeSvgImage({ x, y, href, onClick }) {
  const elem = document.createElementNS(SVG_NS, "image");
  elem.setAttribute("x", x);
  elem.setAttribute("y", y);
  elem.setAttribute("href", href);

  if (onClick) {
    elem.onclick = onClick;
  }

  return elem;
}

export function makeSvgRect({ x, y, width, height }) {
  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  return rect;
}

export function makeSvgText({ x, y, text, color = 'white', fontSize = 16 }) {
  const elem = document.createElementNS(SVG_NS, 'text');
  elem.setAttribute('x', x);
  elem.setAttribute('y', y);
  elem.setAttribute('text-anchor', 'middle');
  elem.setAttribute('dominant-baseline', 'middle');
  elem.setAttribute('font-size', fontSize);
  elem.setAttribute('fill', color);

  const textNode = document.createTextNode(text);
  elem.appendChild(textNode);

  return elem;
}
