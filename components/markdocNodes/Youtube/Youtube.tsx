import * as React from "react";

type YouTubeProps = React.IframeHTMLAttributes<HTMLIFrameElement>;

export function YouTube(props: YouTubeProps) {
  return (
    <div>
      <iframe
        {...props}
        title="Youtube"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ width: "100%", aspectRatio: "16 / 9" }}
      />
    </div>
  );
}
