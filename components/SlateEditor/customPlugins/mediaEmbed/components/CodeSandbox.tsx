import { Element } from "domhandler";

export function createCodeSandboxIframe(src: string) {

  return new Element("iframe", {
    src,
    height: '300px',
    class: "codepen",
    frameBorder: "0",
    style: 'width: 100%; aspectRatio: "16 / 9"',
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  });
}
