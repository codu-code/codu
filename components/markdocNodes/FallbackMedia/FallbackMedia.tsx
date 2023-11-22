import * as React from "react";

export function FallbackMedia(
  props: React.IframeHTMLAttributes<HTMLIFrameElement>,
) {
  return (
    <div>
      {/* TODO Review this as it should have a title */}
      {/* eslint-disable-next-line jsx-a11y/iframe-has-title */}
      <iframe style={{ width: "100%", height: "300px" }} {...props} />
    </div>
  );
}
