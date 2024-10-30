import type { BubbleMenuProps } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react";
import type { FC } from "react";
import { useState } from "react";
import {
  BoldIcon,
  ItalicIcon,
  CodeIcon,
  QuoteIcon,
  MinusSquareIcon,
  Type as TextIcon,
  Heading,
} from "lucide-react";
import { LinkSelector } from "./link-selector";
import { cn } from "@/utils/utils";

export interface BubbleMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof BoldIcon;
}

type EditorBubbleMenuProps = Omit<Required<Pick<BubbleMenuProps, "editor">> & BubbleMenuProps, "children">;

export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = (props) => {
  const items: BubbleMenuItem[] = [
    {
      name: "heading",
      isActive: () => props.editor?.isActive("heading", { level: 2 }) ?? false,
      command: () => props.editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: Heading,
    },
    {
      name: "text",
      isActive: () => props.editor?.isActive("paragraph") ?? false,
      command: () => props.editor?.chain().focus().setParagraph().run(),
      icon: TextIcon,
    },
    {
      name: "bold",
      isActive: () => props.editor?.isActive("bold") ?? false,
      command: () => props.editor?.chain().focus().toggleBold().run(),
      icon: BoldIcon,
    },
    {
      name: "italic",
      isActive: () => props.editor?.isActive("italic") ?? false,
      command: () => props.editor?.chain().focus().toggleItalic().run(),
      icon: ItalicIcon,
    },
    {
      name: "code",
      isActive: () => props.editor?.isActive("code") ?? false,
      command: () => props.editor?.chain().focus().toggleCode().run(),
      icon: CodeIcon,
    },
    {
      name: "quote",
      isActive: () => props.editor?.isActive("blockquote") ?? false,
      command: () => props.editor?.chain().focus().toggleBlockquote().run(),
      icon: QuoteIcon,
    },
    {
      name: "horizontalRule",
      isActive: () => false,
      command: () => props.editor?.chain().focus().setHorizontalRule().run(),
      icon: MinusSquareIcon,
    },
  ];

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    shouldShow: ({ editor }) => {
      if (editor.isActive("image")) {
        return false;
      }
      try {
        if (editor.view.state.selection.$from.before() === 0) {
          return false;
        }
      } catch (error) {
        if (error instanceof RangeError) {
          return false;
        }
      }
      return editor.view.state.selection.content().size > 0;
    },
    tippyOptions: {
      moveTransition: "transform 0.15s ease-out",
      onHidden: () => {
        setIsLinkSelectorOpen(false);
      },
    },
  };

  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="flex w-fit divide-x divide-stone-200 rounded border border-stone-200 bg-white shadow-xl"
    >
      <div className="flex">
        {items.map((item, index) => (
          <button
            type="button"
            key={index}
            onClick={item.command}
            className="p-2 text-stone-600 hover:bg-stone-100 active:bg-stone-200"
          >
            <item.icon
              className={cn("h-4 w-4", {
                "text-pink-200": item.isActive(),
              })}
            />
          </button>
        ))}
      </div>
      {props.editor && (
        <LinkSelector
          editor={props.editor}
          isOpen={isLinkSelectorOpen}
          setIsOpen={() => {
            setIsLinkSelectorOpen(!isLinkSelectorOpen);
          }}
        />
      )}
    </BubbleMenu>
  );
};