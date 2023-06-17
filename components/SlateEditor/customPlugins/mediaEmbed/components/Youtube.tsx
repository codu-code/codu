import { Element } from "domhandler";

export function createYoutubeIframe(src: string) {
  return new Element("iframe", {
    src,
    class: "youtube",
    frameBorder: "0",
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    style: 'width: 100%; aspect-ratio: 16 / 9',
  });
}
