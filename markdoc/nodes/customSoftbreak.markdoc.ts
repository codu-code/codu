// Markdoc automatically inserts a "softbreak" node in the document
// AST in places where there is a single line break.
// By default, a softbreak renders as a single space,
// https://github.com/markdoc/markdoc/discussions/338

const softbreakNode = {
  transform() {
    return "\n";
  },
};

export default softbreakNode;
