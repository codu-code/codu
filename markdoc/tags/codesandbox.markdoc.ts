import { CodeSandbox } from "../../components/CodeSandbox/CodeSandbox";

const codesandbox = {
  render: "CodeSandbox",
  component: CodeSandbox,
  attributes: {
    src: {
      type: String,
      required: true,
    },
    width: {
      type: String,
      default: "100%",
    },
  },
};

export default codesandbox;
