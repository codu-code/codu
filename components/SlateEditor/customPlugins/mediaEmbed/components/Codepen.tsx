import { Element } from "domhandler";

export function createCodepenIframe(src: string) {

  return new Element("iframe", {
    src,
    height: '300px',
    class: "codepen",
    frameBorder: "0",
    style: 'width: 100%;',
    loading: 'lazy'
  });
}