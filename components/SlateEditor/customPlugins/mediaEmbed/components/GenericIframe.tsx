const domhandler_1 = require("domhandler");

export function createGenericIframe(src: string) {

  return new domhandler_1.Element("iframe", {
    src,
    class: "generic-iframe",
    style: 'width: 100%; height: 300px',
  });
}