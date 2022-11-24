import { YouTube } from "../../components/markdocNodes/Youtube/Youtube";

const youtube = {
  render: "Youtube",
  component: YouTube,
  attributes: {
    src: {
      type: String,
      required: true,
    },
  },
};

export default youtube;
