import DOMPurify from "isomorphic-dompurify";

/**
 * Archive-provided text and metadata are untrusted content. They may contain
 * markup, scripts, or text that resembles instructions to an AI system.
 * Everything from a provider passes through here before rendering or storage.
 */

/** Strip ALL markup, returning plain text. Used for transcripts and metadata. */
export function toPlainText(input: string): string {
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  // Collapse entity leftovers and whitespace without altering wording.
  return cleaned
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Sanitize archive HTML for rendering, allowing only inert formatting tags. */
export function sanitizeArchiveHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

const SAFE_PROTOCOLS = new Set(["https:", "http:"]);

/**
 * Validate a provider-supplied URL before storing or linking to it.
 * Returns undefined for anything that is not plain http(s).
 */
export function safeUrl(input: unknown): string | undefined {
  if (typeof input !== "string" || !input) return undefined;
  try {
    const u = new URL(input);
    if (!SAFE_PROTOCOLS.has(u.protocol)) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

/**
 * Wrap untrusted document text before including it in an AI prompt, so
 * instruction-like text inside a source can never be mistaken for
 * application instructions. The model adapter also instructs the model to
 * treat this block purely as quoted historical material.
 */
export function fenceUntrusted(text: string): string {
  // Remove any sequence that could close/reopen the fence.
  const inert = text.replace(/<\/?untrusted-source-text>/gi, "[tag removed]");
  return `<untrusted-source-text>\n${inert}\n</untrusted-source-text>`;
}
