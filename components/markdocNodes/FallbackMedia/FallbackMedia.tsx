import * as React from "react";

export function FallbackMedia(
  props: React.IframeHTMLAttributes<HTMLIFrameElement>,
) {
  return (
    <div>
      <iframe style={{ width: "100%", height: "300px" }} {...props} />
    </div>
  );
}
