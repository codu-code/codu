interface Props {
  user: string;
  slugHash: string;
  defaultTab?: string;
}

export function CodePen({ user, slugHash, defaultTab = 'result' }: Props) {
  const codePenSrc = new URL(`https://codepen.io/${user}/embed/${slugHash}`);
  codePenSrc.searchParams.set('default-tab', defaultTab);

  return (
    <iframe
      height={400}
      style={{ width: '100%' }}
      scrolling="no"
      src={codePenSrc.toString()}
      frameBorder="no"
      loading="lazy"
      allowTransparency
      allowFullScreen
    >
      See the Pen <a href={`https://codepen.io/${user}/pen/${slugHash}`}>Responsive app showcase</a> by <a href={`https://codepen.io/${user}`}>@{user}</a> on <a href="https://codepen.io">CodePen</a>.
    </iframe>
  )
}
