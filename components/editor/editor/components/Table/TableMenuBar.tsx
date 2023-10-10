import { Editor } from "@tiptap/core";
import {
  ColumnsIcon,
  RowsIcon,
  DeleteIcon,
  BookmarkMinus,
  CheckCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { Dispatch, FunctionComponent, SetStateAction } from "react";

interface TableMenuBarProps {
  editor: Editor;
  setIsTableEditing: Dispatch<SetStateAction<boolean>>;
}

const TableMenuBar: FunctionComponent<TableMenuBarProps> = ({
  editor,
  setIsTableEditing,
}) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-1 max-w-[125px] bg-neutral-800 p-1 rounded">
      <button
        onClick={() => setIsTableEditing(false)}
        className="flex bg-green-700 text-neutral-100 cursor-pointer hover:bg-green-400 justify-center items-center p-1 rounded-md"
      >
        <CheckCheckIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        disabled={!editor.can().addColumnAfter()}
        className="flex bg-neutral-900 text-neutral-100 cursor-pointer hover:bg-neutral-600 justify-center items-center p-1 rounded-md"
      >
        <ColumnsIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().addRowAfter().run()}
        disabled={!editor.can().addColumnAfter()}
        className="flex bg-neutral-900 text-neutral-100 cursor-pointer hover:bg-neutral-600 justify-center items-center p-1 rounded-md"
      >
        <RowsIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().deleteTable().run()}
        disabled={!editor.can().deleteTable()}
        className="flex bg-red-700 text-neutral-100 cursor-pointer hover:bg-red-400 justify-center items-center p-1 rounded-md"
      >
        <Trash2Icon />
      </button>
      <button
        onClick={() => editor.chain().focus().deleteColumn().run()}
        disabled={!editor.can().deleteColumn()}
        className="flex bg-red-700 text-neutral-100 cursor-pointer hover:bg-red-400 justify-center items-center p-1 rounded-md"
      >
        <BookmarkMinus />
      </button>

      <button
        onClick={() => editor.chain().focus().deleteRow().run()}
        disabled={!editor.can().deleteRow()}
        className="flex bg-red-700 text-neutral-100 cursor-pointer hover:bg-red-400 justify-center items-center p-1 rounded-md"
      >
        <DeleteIcon />
      </button>
    </div>
  );
};

export default TableMenuBar;
