import { createPluginFactory, PlatePlugin, ELEMENT_CODE_BLOCK } from '@udecode/plate';
import React, { useEffect, useRef, useState } from "react";
import copy from "copy-to-clipboard";
import Prism from "prismjs";
import { CopyAll } from '@styled-icons/material';

const CustomCodeElement = ({attributes, children, element}) => {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  // useEffect(() => {
  //   if (ref.current) Prism.highlightElement(ref.current, false);
  // }, [children]);

  // useEffect(() => {
  //   if (copied) {
  //     copy(element.children[0].text);
  //     const timeout = setTimeout(() => setCopied(false), 1000);
  //     return () => clearTimeout(timeout);
  //   }
  // }, [copied, element]);

  return (
    <div {...attributes} className="code">
      <pre ref={ref} className="language-js">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const createCustomCodePlugin = createPluginFactory({
  key: ELEMENT_CODE_BLOCK,
  isElement: true,
  component: CustomCodeElement,
});

export default createCustomCodePlugin;
