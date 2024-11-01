import type { BubbleMenuProps } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react";
import type { FC } from "react";
import { useState } from "react";
import {
  BoldIcon,
  ItalicIcon,
} from "lucide-react";

import { NodeSelector } from "./node-selector";
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
  ];

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    shouldShow: ({ editor }) => {
      // don't show if image is selected or a heading
      if (editor.isActive("image") || editor.isActive("heading")) {
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
        setIsNodeSelectorOpen(false);
        setIsLinkSelectorOpen(false);
      },
    },
  };

  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="flex w-fit divide-x divide-stone-200 rounded border border-stone-200 bg-white shadow-xl"
    >
      {props.editor && (
        <NodeSelector
          editor={props.editor}
          isOpen={isNodeSelectorOpen}
          setIsOpen={() => {
            setIsNodeSelectorOpen(!isNodeSelectorOpen);
            setIsLinkSelectorOpen(false);
          }}
        />
      )}
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
        {props.editor && (
          <LinkSelector
            editor={props.editor}
            isOpen={isLinkSelectorOpen}
            setIsOpen={() => {
              setIsLinkSelectorOpen(!isLinkSelectorOpen);
            }}
          />
        )}
      </div>
    </BubbleMenu>
  );
};
