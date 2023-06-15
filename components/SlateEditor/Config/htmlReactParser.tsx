import React, { ReactElement } from 'react';
import Prism from 'prismjs';

interface ReplacedObject {
  attribs?: {
    class?: string;
    [key: string]: any;
  };
  name?: string;
  children?: Array<{ 
    name: string; 
    children: Array<{
      data?: string;
    }>;
  }>;
}


// for adding prism js classes 
export const parseOptions = {
  replace: ({ attribs, name, children }: ReplacedObject): ReactElement | void => {
    if (!attribs || name !== 'pre') return;

    const language = attribs.class && attribs.class.replace('language-', '');
    const codeTags = children && children.filter(child => child.name === 'code');

    if (codeTags && codeTags.length) {
      const processedCode = codeTags.map(codeTag => {
        const isCodeEmpty = codeTag.children.length === 0;

        if (isCodeEmpty) {
          return <code className="block" style={{ minHeight: '1em' }} />;
        } else {
          const code = codeTag.children.map(child => child.data || '').join('');

          if (language && Prism.languages[language]) {
            const highlightedCode = Prism.highlight(code, Prism.languages[language], language);
            return <code className="block" dangerouslySetInnerHTML={{ __html: highlightedCode }} />;
          } else {
            return <code className="block">{code}</code>;
          }
        }
      });

      return <pre className={language ? `language-${language}` : ''}>{processedCode}</pre>;
    }
  },
};


// serialization from slate to html is leaving empty p tags 
// it would be better to replace them with <br/> tags
export function replaceEmptyTags(html: string) {
  return html.replace(/<p>\s*<\/p>/g, '<br />');
}