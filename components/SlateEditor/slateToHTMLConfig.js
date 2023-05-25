"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const domhandler_1 = require("domhandler");
// Map Slate element names to HTML tag names
// Staightforward transform - no attributes are considered
// Use transforms instead for more complex operations
const ELEMENT_NAME_TAG_MAP = {
  p: "p",
  paragraph: "p",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  ul: "ul",
  ol: "ol",
  li: "li",
  blockquote: "blockquote",
};
const MARK_ELEMENT_TAG_MAP = {
  strikethrough: ["s"],
  bold: ["strong"],
  underline: ["u"],
  italic: ["i"],
  code: ["pre", "code"],
};
exports.config = {
  markMap: MARK_ELEMENT_TAG_MAP,
  elementMap: ELEMENT_NAME_TAG_MAP,
  elementTransforms: {
    quote: ({ children = [] }) => {
      const p = [new domhandler_1.Element("p", {}, children)];
      return new domhandler_1.Element("blockquote", {}, p);
    },
  //   p: ({ node, children = [] }) => {
  //   if (node.children[0].text === '') {
  //     return new domhandler_1.Element("br", {}, []);
  //   }
  //   return new domhandler_1.Element(
  //     "p",
  //     {},
  //     children
  //   );
  // },
    a: ({ node, children = [] }) => {
      const element = new domhandler_1.Element(
        "a",
        {
          href: node.url,
          target: "_blank",
        },
        children
      );
      return element;
    },
  },
  encodeEntities: true,
  alwaysEncodeBreakingEntities: false,
  alwaysEncodeCodeEntities: false,
  convertLineBreakToBr: false,
};
