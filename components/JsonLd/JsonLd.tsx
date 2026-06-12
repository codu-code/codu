/**
 * Renders schema.org structured data as a JSON-LD script tag (the standard
 * Next.js pattern), with `</script>` breakout escaping (see below).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
 */

interface JsonLdProps {
  data: any;
}

export function JsonLd({ data }: JsonLdProps) {
  // JSON.stringify doesn't escape `<`, `>`, `&`, so a `</script>` value could
  // break out of the tag. Escape to JSON unicode (inert in HTML).
  const jsonString = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      // Safe: JSON.stringify escapes special chars, data is from trusted DB
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
