import { createParagraphPlugin, ELEMENT_PARAGRAPH } from '@udecode/plate-paragraph';
import { PlatePlugin } from '@udecode/plate-core';
import { RenderElementProps } from 'slate-react';

const renderElement = (props: RenderElementProps) => {
  if (props.element.type === ELEMENT_PARAGRAPH) {
    const isEmpty = props.children && Array.isArray(props.children) && props.children.every(({ children }) => children.text === '');
    // Check if the paragraph is empty
    if (isEmpty) {
      // Render a line break
      return <p><br /></p>;
    }
  }

  // If it's not a paragraph node or it's not empty, just render the children
  return <p>{props.children}</p>;
};

export const createCustomParagraphPlugin = (): PlatePlugin => ({
  ...createParagraphPlugin(),
  renderElement,
});
