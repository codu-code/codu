import Code from "../../components/markdocNodes/Code/Code";

const fence = {
  render: "Code",
  component: Code,
  attributes: {
    language: {
      type: String,
    },
  },
};

export default fence;
