import Youtube from "@tiptap/extension-youtube";

const UpdatedYoutube = Youtube.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      enableIFrameApi: "true",
    };
  },
});

export default UpdatedYoutube;
