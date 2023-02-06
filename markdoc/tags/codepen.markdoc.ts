const codepen = {
  render: 'CodePen',
  attributes: {
    user: {
      type: String,
      required: true,
    },
    slugHash: {
      type: String,
      required: true,
    },
    defaultTab: {
      type: String,
    },
    height: {
      type: String,
    },
  },
};

export default codepen;
