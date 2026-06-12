const FIGMA_URL_PATTERN = /figma\.com/i;

type AdfMark = {
  type?: string;
  attrs?: Record<string, unknown>;
};

type AdfNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: AdfNode[];
  marks?: AdfMark[];
};

function isAdfNode(value: unknown): value is AdfNode {
  return typeof value === "object" && value !== null;
}

export function adfToPlainText(node: unknown): string {
  if (!isAdfNode(node)) {
    return "";
  }

  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }

  if (node.type === "hardBreak") {
    return "\n";
  }

  const children = node.content ?? [];
  const parts = children.map((child) => adfToPlainText(child)).filter(Boolean);
  const joined = parts.join(node.type === "paragraph" || node.type === "heading" ? "" : "");

  if (node.type === "paragraph" || node.type === "heading" || node.type === "listItem") {
    return `${joined}\n`;
  }

  return joined;
}

export function normalizePlainText(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractUrlsFromAdf(node: unknown, urlPattern?: RegExp): string[] {
  const urls: string[] = [];

  function walk(value: unknown): void {
    if (!isAdfNode(value)) {
      return;
    }

    if (value.type === "text" && Array.isArray(value.marks)) {
      for (const mark of value.marks) {
        if (mark.type === "link" && typeof mark.attrs?.href === "string") {
          urls.push(mark.attrs.href);
        }
      }
    }

    if (value.type === "inlineCard" && typeof value.attrs?.url === "string") {
      urls.push(value.attrs.url);
    }

    for (const child of value.content ?? []) {
      walk(child);
    }
  }

  walk(node);

  const unique = [...new Set(urls)];
  if (!urlPattern) {
    return unique;
  }

  return unique.filter((url) => urlPattern.test(url));
}

export function extractFigmaUrls(node: unknown): string[] {
  return extractUrlsFromAdf(node, FIGMA_URL_PATTERN);
}
