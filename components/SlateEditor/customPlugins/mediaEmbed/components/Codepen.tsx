const domhandler_1 = require("domhandler");

export function createCodepenIframe(src: string) {

  return new domhandler_1.Element("iframe", {
    src,
    height: '300px',
    class: "codepen",
    frameBorder: "0",
    style: 'width: 100%;',
    loading: 'lazy'
  });
}