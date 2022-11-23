import { Node, Tag } from "@markdoc/markdoc";
import Code from "../../components/markdocNodes/Code/Code";

const markdocExample = {
  render: "Code",
  component: Code,
  attributes: {},
  transform(node: Node, config: any) {
    const attributes = node.transformAttributes(config);
    const { content, language } = node.children[0].attributes;

    // TODO Handle errors
    console.error(node.errors);

    return new Tag(this.render, { ...attributes, language }, [content]);
  },
};

export default markdocExample;
