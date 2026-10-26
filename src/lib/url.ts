export interface ParsedLink {
  url: string;
  title: string;
  domain: string;
  keywords: string[];
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Derives a normalized url, a readable title, the domain and keyword words
// from whatever the user pasted. Returns null when the text is not a link.
export function parsePastedLink(raw: string): ParsedLink | null {
  let text = raw.trim();
  if (!text) return null;
  if (!/^https?:\/\//i.test(text)) {
    if (!/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text)) return null;
    text = `https://${text}`;
  }
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const domain = parsed.hostname.replace(/^www\./, "");
  const words = parsed.pathname
    .split("/")
    .filter(Boolean)
    .map((seg) => {
      try {
        return decodeURIComponent(seg);
      } catch {
        return seg;
      }
    })
    .flatMap((seg) => seg.replace(/\.(html?|php|aspx?|md)$/i, "").split(/[-_.+]+/))
    .map((w) => w.trim())
    .filter((w) => /^[a-zA-Z][a-zA-Z0-9']*$/.test(w) && w.length > 1);

  const display = words.slice(0, 6).map(capitalize).join(" ");
  return {
    url: parsed.href,
    title: display ? `${domain} — ${display}` : domain,
    domain,
    keywords: words.slice(0, 8).map((w) => w.toLowerCase()),
  };
}
