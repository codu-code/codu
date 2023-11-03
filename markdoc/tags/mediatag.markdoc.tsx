import { Media } from "../../components/markdocNodes/Media/Media";

const media = {
  render: "Media",
  component: Media,
  attributes: {
    src: {
      type: String,
      required: true,
    },
  },
};

export default media;
