import {
    CodeBlockElement,
    createPlateUI,
    ELEMENT_CODE_BLOCK,
    ELEMENT_MEDIA_EMBED,
    ELEMENT_PARAGRAPH,
    ELEMENT_H3,
    ELEMENT_H4,
    ELEMENT_OL,
    ELEMENT_UL,
    ELEMENT_LI,
    MARK_FONT_SIZE,
    MediaEmbedElement,
    StyledElement,
    withProps,
  } from '@udecode/plate';
  import { CustomParagraphComponent } from './customPlugins/CustomParagraphPlugin';
  import { CustomCodeBlockComponent } from './customPlugins/createCustomCodeBlockPlugin';
  import { CustomH3Component, CustomH4Component } from './customPlugins/customHeadingPlugin';

  export const plateUI = createPlateUI({
  [ELEMENT_MEDIA_EMBED]: withProps(MediaEmbedElement, {
    nodeProps: {
      twitterOptions: {
        theme: 'dark',
      },
    },
  }),
  [ELEMENT_CODE_BLOCK]: CodeBlockElement,
  [ELEMENT_PARAGRAPH]: CustomParagraphComponent,
  [ELEMENT_H3] : CustomH3Component,
  [ELEMENT_H4] : CustomH4Component,
});
