// import { config as defaultConfig } from "slate-serializers/lib/config/htmlToSlate/default";
import { getAttributeValue } from 'domutils'
import { HtmlToSlateConfig } from "slate-serializers";


export const config: HtmlToSlateConfig = {
  elementTags: {
    pre: (el) => ({
      type: 'code_block',
      lang: el.attribs.class?.split('-')[1] || null, 
    }),
    code: () => ({ type: 'code_line' }),
    a: (el) => ({
      type: 'a',
      newTab: el && getAttributeValue(el, 'target') === '_blank',
      url: el && getAttributeValue(el, 'href'),
    }),
    // br: () => ({ type: 'line_break'}),
    blockquote: () => ({ type: 'blockquote' }),
    h1: () => ({ type: 'h1' }),
    h2: () => ({ type: 'h2' }),
    h3: () => ({ type: 'h3' }),
    h4: () => ({ type: 'h4' }),
    h5: () => ({ type: 'h5' }),
    h6: () => ({ type: 'h6' }),
    li: () => ({ type: 'li' }),
    ol: () => ({ type: 'ol' }),
    p: () => ({ type: 'p' }),
    ul: () => ({ type: 'ul' }),
  },
  textTags: {
    // code: () => ({ code: true }),
    // pre: () => ({ code: true }),
    del: () => ({ strikethrough: true }),
    em: () => ({ italic: true }),
    i: () => ({ italic: true }),
    s: () => ({ strikethrough: true }),
    strong: () => ({ bold: true }),
    u: () => ({ underline: true }),
  },
  // htmlPreProcessString: (html) => html.replace(/<pre[^>]*>/g, '<code>').replace(/<\/pre>/g, '</code>'),
  filterWhitespaceNodes: true,
  convertBrToLineBreak: false,
}

//    p: ({ node, children = [] }) => {
//   const hasFontSize = node.children[0].fontSize;
  
//   if (!hasFontSize) {
//     const element = new domhandler_1.Element('p', {}, []);
//     element.children = children;
//     return element;
//   }
  
//   const className = 'post_text_xl';
//   const element = new domhandler_1.Element('p', { class: className }, children);
//   return element;
// },