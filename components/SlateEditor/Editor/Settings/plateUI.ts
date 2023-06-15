import {
    CodeBlockElement,
    createPlateUI,
    ELEMENT_CODE_BLOCK,
    ELEMENT_MEDIA_EMBED,
    ELEMENT_PARAGRAPH,
    ELEMENT_H3,
    ELEMENT_H4,
    MediaEmbedElement,
    withProps,
  } from '@udecode/plate';
  import { CustomParagraphComponent } from '../../customPlugins/Paragraph/CustomParagraphPlugin';
  import { CustomH3Component, CustomH4Component } from '../../customPlugins/Heading/customHeadingPlugin';

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
