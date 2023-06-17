import { Element } from "domhandler";

export function createGenericIframe(src: string) {

  return new Element("iframe", {
    src,
    class: "generic-iframe",
    style: 'width: 100%; height: 300px',
  });
}