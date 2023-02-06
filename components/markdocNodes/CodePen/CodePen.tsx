import { useEffect } from "react";

interface Props {
  user: string;
  slugHash: string;
  defaultTab?: string;
  height?: string;
}

export function CodePen({
  user,
  slugHash,
  defaultTab = 'result',
  height = '400px',
}: Props) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cpwebassets.codepen.io/assets/embed/ei.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <p
      className="codepen"
      data-default-tab={defaultTab}
      data-user={user}
      data-slug-hash={slugHash}
      style={{ width: '100%' }}
      data-height={height}
    >
      See the Pen <a href={`https://codepen.io/${user}/pen/${slugHash}`}>Responsive app showcase</a> by <a href={`https://codepen.io/${user}`}>@{user}</a> on <a href="https://codepen.io">CodePen</a>.
    </p>
  )
}
