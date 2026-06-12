/**
 * JSON-LD structured data component
 *
 * Renders schema.org structured data as a script tag.
 * The serialized JSON additionally escapes `<`, `>`, and `&` (which
 * JSON.stringify leaves untouched) so a value containing `</script>` cannot
 * break out of the script tag. This is the standard Next.js pattern for JSON-LD.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
 */

interface JsonLdProps {
  data: any;
}

export function JsonLd({ data }: JsonLdProps) {
  // JSON.stringify does NOT escape `<`, `>`, or `&`, so a value containing
  // `</script>` would break out of the script tag. Escape them to their JSON
  // unicode equivalents — valid inside JSON string values and inert in HTML.
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
