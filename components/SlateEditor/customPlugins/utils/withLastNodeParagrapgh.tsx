import { Transforms, Editor, Path } from "slate";

export const isLastNodeInEditor = (editor: any) => {
  const [lastNode, lastPath] = Editor.last(editor, []);
  const [_, parentPath] = Editor.parent(editor, lastPath);
  return Path.equals(parentPath, Editor.path(editor, []));
};

export const withLastNodeParagraph = (editor: any, elementType: string) => {
  const { apply } = editor;

  editor.apply = (operation: any) => {
    if (
      operation.type === "insert_node" &&
      operation.node.type === elementType
    ) {
      if (isLastNodeInEditor(editor)) {
        const emptyNode = { type: "p", children: [{ text: "" }] };
        Transforms.insertNodes(editor, emptyNode, {
          at: Editor.end(editor, []),
        });
      }
    }

    apply(operation);
  };

  return editor;
};

export const getLastTextPath = (editor: any) => {
  const { anchor } = Editor.range(editor, Editor.end(editor, []));
  let path;

  if (anchor) {
    path = anchor.path;
    while (editor.children[path[0]].type !== "text") {
      path.pop();
    }
  }

  return path;
};
