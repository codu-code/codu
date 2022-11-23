import { CodeSandbox } from "../../components/markdocNodes/CodeSandbox/CodeSandbox";

const codesandbox = {
  render: "CodeSandbox",
  component: CodeSandbox,
  attributes: {
    src: {
      type: String,
      required: true,
    },
  },
};

export default codesandbox;
