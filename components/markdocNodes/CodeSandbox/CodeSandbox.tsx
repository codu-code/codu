import * as React from "react";

export function CodeSandbox(props: React.ReactPropTypes) {
  return (
    <div style={{ marginInline: "16px 0px" }}>
      <iframe
        {...props}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: "100%", aspectRatio: "16 / 9" }}
      />
    </div>
  );
}
