import { YouTube } from "../../components/Youtube/Youtube";

const youtube = {
  render: "Youtube",
  component: YouTube,
  attributes: {
    src: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    width: {
      type: String,
      default: "100%",
    },
  },
};

export default youtube;
