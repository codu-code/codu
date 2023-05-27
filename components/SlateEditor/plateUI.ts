import {
    CodeBlockElement,
    createPlateUI,
    ELEMENT_CODE_BLOCK,
    ELEMENT_MEDIA_EMBED,
    ELEMENT_PARAGRAPH,
    MARK_FONT_SIZE,
    MediaEmbedElement,
    StyledElement,
    withProps,
  } from '@udecode/plate';
  import { CustomFontSizeComponent } from './customPlugins/createFontSizePlugin';
  import { createCustomParagraphPlugin, CustomParagraphComponent } from './customPlugins/CustomParagraphPlugin';

  export const plateUI = createPlateUI({
  [ELEMENT_MEDIA_EMBED]: withProps(MediaEmbedElement, {
    nodeProps: {
      twitterOptions: {
        theme: 'dark',
      },
    },
  }),
  [ELEMENT_CODE_BLOCK]: CodeBlockElement,
  [ELEMENT_PARAGRAPH]: CustomParagraphComponent
});
