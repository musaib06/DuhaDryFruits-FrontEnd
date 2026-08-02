/**
 * Convert Quill/HTML rich text into clean plain text for shares, OG tags, and JSON-LD.
 */
export function htmlToPlainText(html: string | null | undefined, doc?: Document | null): string {
  if (!html) return '';

  let text = '';

  if (doc?.createElement) {
    const el = doc.createElement('div');
    el.innerHTML = html;
    text = el.textContent || (el as HTMLElement).innerText || '';
  } else {
    text = html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&rsquo;|&lsquo;/gi, "'")
      .replace(/&rdquo;|&ldquo;/gi, '"')
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  }

  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Truncate plain text on a word boundary. */
export function truncatePlainText(text: string, maxLen: number): string {
  const t = (text || '').trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, Math.max(0, maxLen - 1));
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}
