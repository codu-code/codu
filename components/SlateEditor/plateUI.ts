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
  
  export const plateUI = createPlateUI({
    [ELEMENT_MEDIA_EMBED]: withProps(MediaEmbedElement, {
      nodeProps: {
        twitterOptions: {
          theme: 'dark',
        },
      },
    }),
    [ELEMENT_CODE_BLOCK]: CodeBlockElement,
    [ELEMENT_PARAGRAPH]: withProps(StyledElement, {
      // as: 'p',
      styles: {
        root: {
          margin: 0,
          padding: '4px 0',
        },
      },
      prefixClassNames: 'p',
    }),
    [MARK_FONT_SIZE]: withProps(StyledElement, {
      // as: 'p',
      styles: {
        root: {
          fontSize: '20px'
        },
      },
    }),
  });
  