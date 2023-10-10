import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import {
  BookmarkMinus,
  ColumnsIcon,
  DeleteIcon,
  RowsIcon,
  Trash2Icon,
} from "lucide-react";
import React from "react";

const CustomTableNodeView = (props: NodeViewProps) => {
  const { editor } = props;

  return (
    <NodeViewWrapper>
      <div className="flex">
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          className="flex w-fit h-fit bg-neutral-900 text-neutral-100 cursor-pointer hover:bg-neutral-600 justify-center items-center p-1 rounded-md"
        >
          <ColumnsIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          className="flex w-fit h-fit bg-neutral-900 text-neutral-100 cursor-pointer hover:bg-neutral-600 justify-center items-center p-1 rounded-md"
        >
          <RowsIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn()}
          className="flex w-fit h-fit bg-red-700 text-neutral-100 cursor-pointer hover:bg-red-400 justify-center items-center p-1 rounded-md"
        >
          <BookmarkMinus />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow()}
          className="flex w-fit h-fit bg-red-700 text-neutral-100 cursor-pointer hover:bg-red-400 justify-center items-center p-1 rounded-md"
        >
          <DeleteIcon />
        </button>
        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
          className="flex w-fit h-fit bg-red-700 text-neutral-100 cursor-pointer hover:bg-red-400 justify-center items-center p-1 rounded-md"
        >
          <Trash2Icon />
        </button>
      </div>
      <NodeViewContent
        className="bg-neutral-100 w-full table-fixed overflow-scroll"
        as="table"
      ></NodeViewContent>
    </NodeViewWrapper>
  );
};

export default CustomTableNodeView;
