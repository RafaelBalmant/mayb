/** A schema.org JSON-LD block ("<" escaped so the JSON can never close the tag). */
export const JsonLd = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
  />
);
