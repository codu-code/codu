import * as React from 'react';

export function FallbackMedia(props: React.IframeHTMLAttributes<HTMLIFrameElement>) {
  return (
    <div>
      <iframe {...props} />
      <style >
        {`
          iframe {
            width: 100%;
            height: 600px;
          }
        `}
      </style>
    </div>
  );
}
