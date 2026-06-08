/**
 * JSON-LD structured data component
 *
 * Renders schema.org structured data as a script tag.
 * This is safe because:
 * 1. JSON.stringify escapes special characters (quotes, backslashes, etc.)
 * 2. The data comes from our database (trusted internal data)
 * 3. This is the standard Next.js pattern for JSON-LD structured data
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
 */

interface JsonLdProps {
  data: any;
}

export function JsonLd({ data }: JsonLdProps) {
  // JSON.stringify escapes characters that could break out of the script tag
  // This is safe for trusted data from our database
  const jsonString = JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      // Safe: JSON.stringify escapes special chars, data is from trusted DB
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
