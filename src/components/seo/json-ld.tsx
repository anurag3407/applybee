/**
 * JSON-LD block. Structured data is what lets a search result or an answer
 * engine quote a specific claim (a price, an FAQ answer, a policy date)
 * instead of guessing from prose.
 *
 * `<` is escaped because the payload is injected raw: a `</script>` sequence in
 * any string would otherwise close the element early and run as markup.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
