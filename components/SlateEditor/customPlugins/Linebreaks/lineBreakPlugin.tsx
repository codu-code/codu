import { createPluginFactory } from "@udecode/plate";

const ELEMENT_LINE_BREAK = "line_break";

export const createLineBreakPlugin = createPluginFactory({
  key: ELEMENT_LINE_BREAK,
  isElement: true,
  deserializeHtml: {
    rules: [{ validNodeName: "BR" }],
  },
  //@ts-ignore
  serializeHtml: ({ element }) => {
    if (element.type === ELEMENT_LINE_BREAK) {
      return "<br />";
    }
  },
});
