import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Node } from "prosemirror-model";
import React from "react";

const CustomTableRowNodeView = (props: NodeViewProps) => {
  const { node } = props;

  const handleDeleteRow = () => {
    // Implement logic to delete the row here
    // You can access the node and view to perform the deletion
  };

  const handleAddRow = () => {
    // Implement logic to add another row here
    // You can access the node and view to perform the addition
  };

  return (
    <NodeViewWrapper>
      {/* Render your custom buttons here */}
      <button onClick={handleDeleteRow}>Delete Row</button>
      <button onClick={handleAddRow}>Add Row</button>
      {node.content.map((cell, index) => (
        <div key={index} className="your-cell-class">
          {view.component(cell)}
        </div>
      ))}
    </NodeViewWrapper>
  );
};

export default CustomTableRowNodeView;
