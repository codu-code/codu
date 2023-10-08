import styles from "./Toolbar.module.css";
import { BubbleMenu, BubbleMenuProps, Editor } from "@tiptap/react";
import { FC, useState, ChangeEvent } from "react";
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
} from "lucide-react";

// import { NodeSelector } from "./node-selector";
// import { LinkSelector } from "./link-selector";
import { cn } from "@/utils/utils";

type ToolbarProps = Omit<BubbleMenuProps, "children">;

export interface ToolbarItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof BoldIcon;
}

function Toolbar({ editor }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleExpand = (e: ChangeEvent<HTMLInputElement>) => {
    setIsOpen(e.target.checked);
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
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              type="button"
              className={editor.isActive("bold") ? "is-active" : ""}
            >
              <BoldIcon color={editor.isActive("bold") ? "coral" : "white"} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "is-active" : ""}
            >
              <ItalicIcon
                color={editor.isActive("italic") ? "coral" : "white"}
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive("italic") ? "is-active" : ""}
            >
              <UnderlineIcon
                color={editor.isActive("underline") ? "coral" : "white"}
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              // className={editor.isActive('strike') ? 'is-active' : ''}
            >
              <StrikethroughIcon
                color={editor.isActive("strike") ? "coral" : "white"}
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              // className={editor.isActive('code') ? 'is-active' : ''}
            >
              <CodeIcon color={editor.isActive("code") ? "coral" : "white"} />
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              // className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            >
              <Heading2Icon
                color={
                  editor.isActive("heading", { level: 2 }) ? "coral" : "white"
                }
              />
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              // className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            >
              <Heading3Icon
                color={
                  editor.isActive("heading", { level: 3 }) ? "coral" : "white"
                }
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              // className={editor.isActive('bulletList') ? 'is-active' : ''}
            >
              <ListIcon
                color={editor.isActive("bulletList") ? "coral" : "white"}
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              // className={editor.isActive('orderedList') ? 'is-active' : ''}
            >
              <ListOrderedIcon
                color={editor.isActive("orderedList") ? "coral" : "white"}
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              // className={editor.isActive('codeBlock') ? 'is-active' : ''}
            >
              <SquareCodeIcon
                color={editor.isActive("codeBlock") ? "coral" : "white"}
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              // className={editor.isActive('blockquote') ? 'is-active' : ''}
            >
              <QuoteIcon
                color={editor.isActive("blockquote") ? "coral" : "white"}
              />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              type="button"
            >
              <RectangleHorizontalIcon
                color={editor.isActive("setHorizontalRule") ? "coral" : "white"}
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
            >
              <UndoIcon />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
            >
              <RedoIcon />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              // className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
            >
              <AlignLeftIcon
                color={
                  editor.isActive({ textAlign: "left" }) ? "coral" : "white"
                }
              />
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              // className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
            >
              <AlignCenterIcon
                color={
                  editor.isActive({ textAlign: "center" }) ? "coral" : "white"
                }
              />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              // className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
            >
              <AlignRightIcon
                color={
                  editor.isActive({ textAlign: "right" }) ? "coral" : "white"
                }
              />
            </button>
            <button
              type="button"
              onClick={() => {
                if (editor.isActive("superscript")) {
                  editor.chain().focus().toggleSuperscript().run();
                }
                editor.chain().focus().toggleSubscript().run();
              }}
            >
              <SubscriptIcon
                color={editor.isActive("subscript") ? "coral" : "white"}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                if (editor.isActive("subscript")) {
                  editor.chain().focus().toggleSubscript().run();
                }

                editor.chain().focus().toggleSuperscript().run();
              }}
            >
              <SuperscriptIcon
                color={editor.isActive("superscript") ? "coral" : "white"}
              />
            </button>
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
