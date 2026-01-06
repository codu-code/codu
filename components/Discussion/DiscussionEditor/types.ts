export type EditorMode = "rich" | "markdown";

export interface DiscussionEditorState {
  isExpanded: boolean;
  mode: EditorMode;
  content: string;
  isSubmitting: boolean;
}

export interface DiscussionEditorProps {
  onSubmit: (markdown: string) => Promise<void>;
  onCancel?: () => void;
  initialContent?: string;
  autoExpand?: boolean;
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
}
