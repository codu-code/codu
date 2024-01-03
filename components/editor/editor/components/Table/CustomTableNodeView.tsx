import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import {
  BookmarkMinus,
  ColumnsIcon,
  DeleteIcon,
  RowsIcon,
  Trash2Icon,
} from "lucide-react";
import type { FunctionComponent, ReactNode } from "react";

import styles from "../Toolbar/Toolbar.module.css";

interface TableButtonProps {
  disabled: boolean;
  onClick: () => boolean | void;
  icon: ReactNode;
  className: string;
  title: string;
}

const TableButton: FunctionComponent<TableButtonProps> = ({
  onClick,
  disabled,
  icon,
  className,
  title,
}) => {
  return (
    <div className={styles.buttonContainer} data-tooltip={title}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`relative flex h-fit w-fit cursor-pointer items-center justify-center rounded-md p-1 text-neutral-100 ${className}`}
      >
        {icon}
        <div className={`${styles.tooltip} top-8`}>
          <span className="text-sm">{title}</span>
        </div>
      </button>
    </div>
  );
};

const CustomTableNodeView = (props: NodeViewProps) => {
  const { editor } = props;

  return (
    <NodeViewWrapper>
      <div className="flex gap-1">
        <TableButton
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          className="bg-neutral-900 hover:bg-neutral-600"
          icon={<ColumnsIcon />}
          title="Add Column"
        />
        <TableButton
          onClick={() => editor.chain().focus().addRowAfter().run()}
          disabled={!editor.can().addColumnAfter()}
          className="bg-neutral-900 hover:bg-neutral-600"
          title="Add Row"
          icon={<RowsIcon />}
        />
        <TableButton
          onClick={() => editor.chain().focus().deleteColumn().run()}
          disabled={!editor.can().deleteColumn()}
          className="bg-red-700 hover:bg-red-400"
          title="Delete Column"
          icon={<BookmarkMinus />}
        />

        <TableButton
          onClick={() => editor.chain().focus().deleteRow().run()}
          disabled={!editor.can().deleteRow()}
          className="bg-red-700 hover:bg-red-400"
          title="Delete Row"
          icon={<DeleteIcon />}
        />
        <TableButton
          onClick={() => editor.chain().focus().deleteTable().run()}
          disabled={!editor.can().deleteTable()}
          className="bg-red-700 hover:bg-red-400"
          title="Delete Table"
          icon={<Trash2Icon />}
        />
      </div>
      <NodeViewContent
        className="w-full table-fixed overflow-scroll bg-neutral-100"
        as="table"
      ></NodeViewContent>
    </NodeViewWrapper>
  );
};

export default CustomTableNodeView;
