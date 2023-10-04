interface Props {
  src: string;
  defaultTab?: string;
  height?: string;
}

export function CodePen({
  src,
  defaultTab = "html,result",
  height = "300px",
}: Props) {
  const codePenSrc = new URL(src);
  if (!codePenSrc.searchParams.get("default-tab")) {
    codePenSrc.searchParams.set("default-tab", defaultTab);
  }

  return (
    <iframe
      height={height}
      style={{ width: "100%" }}
      scrolling="no"
      src={codePenSrc.toString()}
      frameBorder="no"
      loading="lazy"
      allowFullScreen
    />
  );
}
