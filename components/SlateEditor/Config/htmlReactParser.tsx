import Prism from 'prismjs';

export const parseOptions = {
  replace: ({ attribs, name, children }) => {
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