/**
 * shared/lib/json-highlight — syntax-highlight a JSON string to HTML.
 *
 * Pure + isomorphic. Wraps tokens in `<span class="t-key|t-str|t-num|t-bool|t-null">`
 * (style those classes at the call site). Input is HTML-escaped first, so the
 * output is safe to inject. Same token rules as the editor's live preview.
 */
export function highlightJson (source: string): string {
  const esc = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(
    /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'num'
      if (match.startsWith('"')) cls = /:$/.test(match) ? 'key' : 'str'
      else if (match === 'true' || match === 'false') cls = 'bool'
      else if (match === 'null') cls = 'null'
      return `<span class="t-${cls}">${match}</span>`
    }
  )
}
