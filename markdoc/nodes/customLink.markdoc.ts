import { Tag } from "@markdoc/markdoc";

// creates a custom link node to add _blank and rel noopener to <a> tags
// https://markdoc.dev/docs/nodes#customizing-markdoc-nodes

const link = {
  // Specify that the link node can only contain text as children
  children: ["text"],
  attributes: {
    // original attributes
    href: { type: String, required: true },
    title: { type: String },
  },
  // now add custom attributes
  // The transform method is used to customize the transformation of the link node.
  // TODO: add types
  transform(node, config) {
    const attributes = node.transformAttributes(config);
    const children = node.transformChildren(config);
    const href = attributes.href;

    // Check if href has a protocol, if not add 'http://' by default
    if (!/^(f|ht)tps?:\/\//i.test(href)) {
      attributes.href = "http://" + href;
    }

    return new Tag(
      "a",
      {
        ...attributes,
        target: "_blank",
        rel: "noopener",
      },
      children,
    );
  },
};

export default link;
