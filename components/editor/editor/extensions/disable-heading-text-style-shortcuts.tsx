import { Extension } from "@tiptap/react";

const DisableHeadingTextStyleShortcuts = Extension.create({
  addKeyboardShortcuts() {
    // If the selected node is a heading, disable the text style shortcuts
    return {
      'Mod-b': () => this.editor.isActive("heading") ?? this.editor.commands.toggleBold(),
      'Mod-i': () => this.editor.isActive("heading") ?? this.editor.commands.toggleItalic(),
      'Mod-u': () => this.editor.isActive("heading") ?? this.editor.commands.toggleUnderline(),
      'Mod-e': () => this.editor.isActive("heading") ?? this.editor.commands.toggleCode(),
      'Mod-shift-x': () => this.editor.isActive("heading") ?? this.editor.commands.toggleStrike(),
      'Mod-shift-h': () => this.editor.isActive("heading") ?? this.editor.commands.toggleHighlight(),
    };
  },
})

export default DisableHeadingTextStyleShortcuts;