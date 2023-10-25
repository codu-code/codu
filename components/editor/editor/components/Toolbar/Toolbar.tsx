import styles from "./Toolbar.module.css";
import { BubbleMenu, BubbleMenuProps, Editor } from "@tiptap/react";
import { Popover, Transition } from "@headlessui/react";
import { FC, useState, ChangeEvent, useCallback } from "react";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ListOrderedIcon,
  ListIcon,
  SquareCodeIcon,
  QuoteIcon,
  RectangleHorizontalIcon,
  UndoIcon,
  RedoIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  SubscriptIcon,
  SuperscriptIcon,
  ImageIcon,
  YoutubeIcon,
  TableIcon,
} from "lucide-react";
import ImageDetailsModal from "@/components/ImageDetailsModal/ImageDetailsModal";

// import { NodeSelector } from "./node-selector";
// import { LinkSelector } from "./link-selector";
import { cn } from "@/utils/utils";
import ToolBarItemButton from "./ToolbarItemButton";
// import TableMenuBar from "../Table/TableMenuBar";

type ToolbarProps = Omit<BubbleMenuProps, "children">;

export interface ToolbarItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof BoldIcon;
}

function Toolbar({ editor }: ToolbarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isTableEditing, setIsTableEditing] = useState(false);

  const [isImageDetailsModalOpen, setIsImageDetailsModalOpen] = useState(false);

  const isRootNode = () => {
    try {
      return editor?.view.state.selection.$from.before() === 0;
    } catch (e) {
      // Handle or log the exception if necessary
      return false;
    }
  };

  const handleExpand = (e: ChangeEvent<HTMLInputElement>) => {
    setIsOpen(e.target.checked);
  };

  // const addImage = useCallback(() => {
  //   const url = window.prompt("URL");

  //   if (url) {
  //     editor?.chain().focus().setImage({ src: url }).run();
  //   }
  // }, [editor]);

  if (!editor) {
    return null;
  }

  const addYoutubeVideo = () => {
    const url = prompt("Enter YouTube URL");

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
      });
    }
  };

  return (
    <div className={`${styles.sticky} bg-neutral-900`}>
      <div className={styles.flex}>
        <div
          className={styles.menu}
          style={{
            transition: "max-height 0.2s ease-in-out",
            maxHeight: isOpen ? "100vh" : "0",
            overflow: "hidden",
          }}
        >
          <div className={styles.buttons}>
            <ToolBarItemButton
              title="Bold"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={
                <BoldIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("bold")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />
            <ToolBarItemButton
              title="Italic"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={
                <ItalicIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("italic")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />
            <ToolBarItemButton
              title="Underline"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              icon={
                <UnderlineIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("underline")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />
            <ToolBarItemButton
              title="Strikeline"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              icon={
                <StrikethroughIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("strike")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />
            <ToolBarItemButton
              title="Code"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleCode().run()}
              icon={
                <CodeIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("code")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="H2"
              isRootNode={isRootNode}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              icon={
                <Heading2Icon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("heading", { level: 2 })
                      ? "coral"
                      : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="H3"
              isRootNode={isRootNode}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              icon={
                <Heading3Icon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("heading", { level: 3 })
                      ? "coral"
                      : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="List"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              icon={
                <ListIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("bulletList")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="Ordered List"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              icon={
                <ListOrderedIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("orderedList")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="Code Block"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              icon={
                <SquareCodeIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("codeBlock")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="Block Quote"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              icon={
                <QuoteIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("blockQuote")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="Horizontal"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              icon={
                <RectangleHorizontalIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("setHorizontalRule")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />
            <ToolBarItemButton
              title="Undo"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().undo().run()}
              icon={<UndoIcon color={isRootNode() ? "gray" : "white"} />}
            />
            <ToolBarItemButton
              title="Redo"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().redo().run()}
              icon={<RedoIcon color={isRootNode() ? "gray" : "white"} />}
            />

            <ToolBarItemButton
              title="Left"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              icon={
                <AlignLeftIcon
                  color={
                    editor.isActive({ textAlign: "left" }) ? "coral" : "white"
                  }
                />
              }
            />
            <ToolBarItemButton
              title="Center"
              isRootNode={isRootNode}
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              icon={
                <AlignCenterIcon
                  color={
                    editor.isActive({ textAlign: "center" }) ? "coral" : "white"
                  }
                />
              }
            />
            <ToolBarItemButton
              title="Right"
              isRootNode={isRootNode}
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              icon={
                <AlignRightIcon
                  color={
                    editor.isActive({ textAlign: "right" }) ? "coral" : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="Subscript"
              isRootNode={isRootNode}
              onClick={() => {
                if (editor.isActive("superscript")) {
                  editor.chain().focus().toggleSuperscript().run();
                }
                editor.chain().focus().toggleSubscript().run();
              }}
              icon={
                <SubscriptIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("subscript")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />

            <ToolBarItemButton
              title="Superscript"
              isRootNode={isRootNode}
              onClick={() => {
                if (editor.isActive("subscript")) {
                  editor.chain().focus().toggleSubscript().run();
                }

                editor.chain().focus().toggleSuperscript().run();
              }}
              icon={
                <SuperscriptIcon
                  color={
                    isRootNode()
                      ? "gray"
                      : editor.isActive("superscript")
                      ? "coral"
                      : "white"
                  }
                />
              }
            />
            <>
              <ToolBarItemButton
                title="Table"
                isRootNode={isRootNode}
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3 })
                    .run();
                  setIsTableEditing(true);
                }}
                icon={
                  <TableIcon
                    color={editor.isActive("insertTable") ? "coral" : "white"}
                  />
                }
              />
            </>
            <ImageDetailsModal
              isImageDetailsModalOpen={isImageDetailsModalOpen}
              setIsImageDetailsModalOpen={setIsImageDetailsModalOpen}
              editor={editor}
            />
            <ToolBarItemButton
              title="Image"
              isRootNode={isRootNode}
              onClick={() => setIsImageDetailsModalOpen(true)}
              icon={<ImageIcon color={isRootNode() ? "gray" : "white"} />}
            />
            <ToolBarItemButton
              title="Youtube"
              isRootNode={isRootNode}
              onClick={addYoutubeVideo}
              icon={<YoutubeIcon color={isRootNode() ? "gray" : "white"} />}
            />
          </div>
        </div>
        <label className={styles.switch}>
          <input type="checkbox" checked={isOpen} onChange={handleExpand} />
          <span
            className={`${styles.slider} ${
              isOpen
                ? "bg-gradient-to-r from-orange-400 to-pink-600"
                : "bg-gray-300"
            } ml-5 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-30`}
          ></span>
        </label>
      </div>
    </div>
  );
}

export default Toolbar;
