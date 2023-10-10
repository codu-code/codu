import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const CustomTableRowNodeView = (props: NodeViewProps) => {
  const { editor } = props;

  const handleAddRow = () => {};

  return (
    <NodeViewWrapper className="bg-neutral-900 p-1 border border-black">
      <button
        onClick={() => editor.chain().focus().deleteRow().run()}
        disabled={!editor.can().deleteTable()}
      >
        Delete Row
      </button>
      <button onClick={handleAddRow}>Add Row</button>
      <NodeViewContent className="content" as="table"></NodeViewContent>
    </NodeViewWrapper>
  );
};

export default CustomTableRowNodeView;
