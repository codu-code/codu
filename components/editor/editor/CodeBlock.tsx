import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { ChangeEvent, FunctionComponent } from "react";

import { lowlight } from "lowlight";

// Change this for code styling
import "highlight.js/styles/monokai-sublime.css";

interface CodeBlockProps {
  node: {
    attrs: {
      language: string;
    };
  };
  updateAttributes: (attributes: { language: string }) => void;
  extension: any; // Extension Files - usually unknown
}
const CodeBlock: FunctionComponent<CodeBlockProps> = ({
  node: {
    attrs: { language: defaultLanguage },
  },
  updateAttributes,
  extension,
}) => {
  const lowlightLanguages = lowlight?.listLanguages();

  console.log(lowlightLanguages);
  return (
    <NodeViewWrapper className="code-block">
      <select
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        contentEditable={false}
        defaultValue={defaultLanguage}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          updateAttributes({ language: event.target.value });
        }}
      >
        <option value="null">auto</option>
        <option disabled>—</option>
        {extension.options.lowlight
          .listLanguages()
          .map((lang: string, index: number) => (
            <option key={index} value={lang}>
              {lang}
            </option>
          ))}
      </select>

      <pre className="bg-black border ">
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlock;
