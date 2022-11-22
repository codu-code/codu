import * as React from 'react';

export function CodeSandbox(props: React.ReactPropTypes) {
  return (
    <div>
      <iframe
        {...props}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <style jsx>
        {`
          div {
            margin: 16px 0px;
          }
          iframe {
            width: 100%;
            aspect-ratio: 16 / 9;
          }
        `}
      </style>
    </div>
  );
}