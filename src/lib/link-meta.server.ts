export const LINK_META_TIMEOUT_MS = 5_000;
export const LINK_META_MAX_BYTES = 1_000_000;
const MAX_REDIRECTS = 4;
const MAX_URL_LENGTH = 2_048;

export interface LinkMetadata {
  title: string | null;
  image: string | null;
  domain: string;
}

function parseIpv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const values = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : Number.NaN));
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return null;
  return values;
}

function isPublicIpv4([a, b, c]: number[]): boolean {
  if (a === undefined || b === undefined || c === undefined) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 0 || b === 168)) return false;
  if (a === 192 && b === 88 && c === 99) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function parseIpv6(host: string): number[] | null {
  const normalized = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (!normalized.includes(":" ) || normalized.includes("%")) return null;

  let address = normalized;
  const lastColon = address.lastIndexOf(":");
  const tail = address.slice(lastColon + 1);
  if (tail.includes(".")) {
    const ipv4 = parseIpv4(tail);
    if (!ipv4) return null;
    const first = ipv4[0];
    const second = ipv4[1];
    const third = ipv4[2];
    const fourth = ipv4[3];
    if (first === undefined || second === undefined || third === undefined || fourth === undefined) return null;
    address = `${address.slice(0, lastColon)}:${((first << 8) | second).toString(16)}:${((third << 8) | fourth).toString(16)}`;
  }

  const halves = address.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const parts = [...left, ...Array.from({ length: missing }, () => "0"), ...right].map((part) =>
    /^[0-9a-f]{1,4}$/.test(part) ? Number.parseInt(part, 16) : Number.NaN,
  );
  return parts.length === 8 && parts.every(Number.isInteger) ? parts : null;
}

function isPublicIpv6(parts: number[]): boolean {
  const first = parts[0];
  if (first === undefined || first < 0x2000 || first > 0x3fff) return false;
  if (parts[0] === 0x2001 && parts[1] === 0x0db8) return false;
  if (parts[0] === 0x2002) return false;

  const isIpv4Mapped = parts.slice(0, 5).every((part) => part === 0) && parts[5] === 0xffff;
  if (isIpv4Mapped) {
    const sixth = parts[6];
    const seventh = parts[7];
    if (sixth === undefined || seventh === undefined) return false;
    return isPublicIpv4([sixth >> 8, sixth & 255, seventh >> 8, seventh & 255]);
  }
  return true;
}

export function isSafeMetaUrl(input: string): URL | null {
  if (input.length === 0 || input.length > MAX_URL_LENGTH) return null;
  try {
    const url = new URL(input);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return null;

    const host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (!host || host.length > 253) return null;
    if (["localhost", ".localhost", ".local", ".internal", ".test", ".invalid", ".example", ".lan", ".home"].some(
      (suffix) => host === suffix || host.endsWith(suffix),
    )) return null;

    const addressHost = host.replace(/^\[|\]$/g, "");
    if (addressHost.includes(":")) {
      const ipv6 = parseIpv6(addressHost);
      return ipv6 && isPublicIpv6(ipv6) ? url : null;
    }

    const ipv4 = parseIpv4(addressHost);
    if (ipv4) return isPublicIpv4(ipv4) ? url : null;
    if (!addressHost.includes(".")) return null;
    if (!/^[a-z0-9.-]+$/.test(addressHost) || addressHost.split(".").some((label) => !label || label.length > 63)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function decodeHtml(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, code: string) => {
    const normalized = code.toLowerCase();
    if (normalized === "amp") return "&";
    if (normalized === "quot") return '"';
    if (normalized === "apos") return "'";
    if (normalized === "lt") return "<";
    if (normalized === "gt") return ">";
    if (normalized === "nbsp") return " ";
    const number = normalized.startsWith("#x")
      ? Number.parseInt(normalized.slice(2), 16)
      : Number.parseInt(normalized.slice(1), 10);
    return Number.isInteger(number) && number >= 0 && number <= 0x10ffff
      ? String.fromCodePoint(number)
      : entity;
  });
}

function readAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const expression = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of tag.matchAll(expression)) {
    const name = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4];
    if (name && value !== undefined) attributes[name] = decodeHtml(value);
  }
  return attributes;
}

function cleanText(value: string | undefined): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 500) : null;
}

export function parseLinkMetadata(html: string, pageUrl: string): LinkMetadata {
  const page = isSafeMetaUrl(pageUrl);
  const domain = page?.hostname.replace(/^www\./i, "") ?? "";
  if (!page) return { title: null, image: null, domain };

  const meta: Record<string, string> = {};
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = readAttributes(match[0]);
    const key = attributes["property"]?.toLowerCase() ?? attributes["name"]?.toLowerCase();
    const content = attributes["content"];
    if (key && content) meta[key] = content;
  }

  const titleTag = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html)?.[1];
  const title = cleanText(meta["og:title"] ?? meta["twitter:title"] ?? (titleTag ? decodeHtml(titleTag.replace(/<[^>]*>/g, "")) : undefined));
  const imageValue = meta["og:image"] ?? meta["twitter:image"];
  let image: string | null = null;
  if (imageValue) {
    try {
      const resolved = isSafeMetaUrl(new URL(imageValue, page).href);
      image = resolved?.href ?? null;
    } catch {
      image = null;
    }
  }
  return { title, image, domain };
}

function fallbackDomain(input: string): string {
  try {
    const url = new URL(input);
    return url.hostname.replace(/^www\./i, "").slice(0, 253);
  } catch {
    return "";
  }
}

function emptyMetadata(domain: string): LinkMetadata {
  return { title: null, image: null, domain };
}

async function readLimitedBody(response: Response, signal: AbortSignal): Promise<string | null> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > LINK_META_MAX_BYTES) return null;
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < LINK_META_MAX_BYTES && !signal.aborted) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const remaining = LINK_META_MAX_BYTES - total;
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      chunks.push(chunk);
      total += chunk.byteLength;
      if (value.byteLength > remaining) {
        await reader.cancel();
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
  if (signal.aborted) return null;

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export async function fetchLinkMetadata(input: string): Promise<LinkMetadata> {
  const original = isSafeMetaUrl(input);
  const domain = fallbackDomain(input);
  if (!original) return emptyMetadata(domain);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LINK_META_TIMEOUT_MS);
  let current = original;
  try {
    let response: Response | null = null;
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });
      if (response.status < 300 || response.status >= 400) break;
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS) return emptyMetadata(domain);
      const next = isSafeMetaUrl(new URL(location, current).href);
      if (!next) return emptyMetadata(domain);
      current = next;
    }

    if (!response?.ok) return emptyMetadata(domain);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return emptyMetadata(domain);
    }
    const html = await readLimitedBody(response, controller.signal);
    return html === null ? emptyMetadata(domain) : parseLinkMetadata(html, current.href);
  } catch {
    return emptyMetadata(domain);
  } finally {
    clearTimeout(timeout);
  }
}