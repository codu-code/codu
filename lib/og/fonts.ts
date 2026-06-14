// Font loading for the OG cards. Satori needs real binaries (TTF/OTF, not
// woff2). loadGoogleFont fetches a TTF slice from Google on demand, which works
// on the edge runtime with nothing to commit. Weights: Bricolage 800 (display),
// Hanken 400/600 (body), JetBrains Mono 400/600 (labels).

type FontSpec = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700 | 800;
  style: 'normal';
};

// The css2 endpoint serves woff2 to modern UAs; spoofing an old UA makes it
// return a truetype url that Satori can parse.
export async function loadGoogleFont(
  family: string,
  weight: number,
  text?: string,
): Promise<ArrayBuffer> {
  const params = new URLSearchParams({ family: `${family}:wght@${weight}` });
  if (text) params.set('text', text);
  const cssUrl = `https://fonts.googleapis.com/css2?${params.toString()}`;
  const css = await fetch(cssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 5.1)' }, // old UA → ttf
  }).then((r) => r.text());
  const url = css.match(/src:\s*url\((.+?)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error(`Could not resolve a TTF for ${family} ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

// Load everything Codú OG cards need. Pass it the text you're about to
// render to subset aggressively (smaller payloads); omit for full sets.
export async function coduFonts(text?: string): Promise<FontSpec[]> {
  const [bricolage, hanken400, hanken600, mono400, mono600] = await Promise.all([
    loadGoogleFont('Bricolage Grotesque', 800, text),
    loadGoogleFont('Hanken Grotesk', 400, text),
    loadGoogleFont('Hanken Grotesk', 600, text),
    loadGoogleFont('JetBrains Mono', 400, text),
    loadGoogleFont('JetBrains Mono', 600, text),
  ]);
  return [
    { name: 'Bricolage Grotesque', data: bricolage, weight: 800, style: 'normal' },
    { name: 'Hanken Grotesk', data: hanken400, weight: 400, style: 'normal' },
    { name: 'Hanken Grotesk', data: hanken600, weight: 600, style: 'normal' },
    { name: 'JetBrains Mono', data: mono400, weight: 400, style: 'normal' },
    { name: 'JetBrains Mono', data: mono600, weight: 600, style: 'normal' },
  ];
}
