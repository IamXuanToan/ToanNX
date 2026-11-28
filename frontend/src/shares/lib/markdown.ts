import { toSafeHttpUrl } from "./safe-url";

export type MarkdownTableAlign = "left" | "center" | "right";

export type MarkdownInline =
  | { type: "text"; value: string }
  | { type: "bold"; children: MarkdownInline[] }
  | { type: "italic"; children: MarkdownInline[] }
  | { type: "boldItalic"; children: MarkdownInline[] }
  | { type: "strike"; children: MarkdownInline[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: MarkdownInline[] };

export type MarkdownListItem = {
  lines: MarkdownInline[][];
  checked?: boolean;
  children?: Extract<MarkdownBlock, { type: "list" }>;
};

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; inlines: MarkdownInline[] }
  | { type: "paragraph"; lines: MarkdownInline[][] }
  | { type: "code"; language: string; content: string }
  | { type: "hr" }
  | { type: "blockquote"; blocks: MarkdownBlock[] }
  | { type: "list"; ordered: boolean; start: number; items: MarkdownListItem[] }
  | {
      type: "table";
      headers: MarkdownInline[][];
      alignments: MarkdownTableAlign[];
      rows: MarkdownInline[][][];
    };

const MAX_INLINE_DEPTH = 4;
const MAX_PARSE_LINES = 2000;
const ESCAPABLE_CHARS = new Set([
  "\\",
  "`",
  "*",
  "_",
  "{",
  "}",
  "[",
  "]",
  "(",
  ")",
  "#",
  "+",
  "-",
  ".",
  "!",
  "~",
  "|",
]);
const HR_REGEX = /^\s*([-*_])(?:\s*\1){2,}\s*$/;
const FENCE_OPEN_REGEX = /^\s*(```|~~~)\s*([A-Za-z0-9_+#.-]*)\s*$/;
const HEADING_REGEX = /^\s{0,3}(#{1,6})\s+(.+?)\s*$/;
const BLOCKQUOTE_REGEX = /^\s{0,3}> ?(.*)$/;
const LIST_ITEM_REGEX = /^(\s*)(?:([-*+\u2022])|(\d{1,9})[.)])\s+(.*)$/;
const TASK_PREFIX_REGEX = /^\[([ xX])\]\s+(.*)$/;
const TABLE_SEPARATOR_REGEX = /^\s*\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)*\s*\|?\s*$/;

function isWordBoundaryLeft(text: string, index: number): boolean {
  if (index <= 0) return true;
  return !/[\p{L}\p{N}_/]/u.test(text[index - 1]);
}

function isWordBoundaryRight(text: string, indexAfter: number): boolean {
  if (indexAfter >= text.length) return true;
  return !/[\p{L}\p{N}_/]/u.test(text[indexAfter]);
}

function pushText(out: MarkdownInline[], value: string): void {
  if (!value) return;
  const last = out.at(-1);
  if (last?.type === "text") {
    last.value += value;
    return;
  }
  out.push({ type: "text", value });
}

function countSameChar(text: string, start: number, char: string): number {
  let count = 0;
  while (start + count < text.length && text[start + count] === char) {
    count += 1;
  }
  return count;
}

function findClosingToken(
  text: string,
  from: number,
  token: string,
  options: { requireWordBoundary?: boolean; disallowInnerEdgeSpace?: boolean } = {},
): number {
  const len = token.length;
  for (let idx = from; idx <= text.length - len; idx += 1) {
    if (text[idx] === "\\" && idx + 1 < text.length) {
      idx += 1;
      continue;
    }
    if (text.slice(idx, idx + len) !== token) continue;
    if (text[idx + len] === token[0]) continue;
    if (idx === from) continue;
    if (options.disallowInnerEdgeSpace && /\s/.test(text[idx - 1])) continue;
    if (options.requireWordBoundary && !isWordBoundaryRight(text, idx + len)) continue;
    return idx;
  }
  return -1;
}

function parseLinkAt(
  text: string,
  start: number,
  depth: number,
): { node: MarkdownInline; nextIndex: number } | null {
  const isImage = text[start] === "!";
  const openBracket = isImage ? start + 1 : start;
  if (text[openBracket] !== "[") return null;

  let bracketDepth = 1;
  let closeBracket = -1;
  for (let i = openBracket + 1; i < text.length; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }
    if (text[i] === "[") bracketDepth += 1;
    else if (text[i] === "]") {
      bracketDepth -= 1;
      if (bracketDepth === 0) {
        closeBracket = i;
        break;
      }
    }
  }
  if (closeBracket === -1 || text[closeBracket + 1] !== "(") return null;

  let parenDepth = 1;
  let closeParen = -1;
  for (let i = closeBracket + 2; i < text.length; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }
    if (text[i] === "(") parenDepth += 1;
    else if (text[i] === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) {
        closeParen = i;
        break;
      }
    }
  }
  if (closeParen === -1) return null;

  const labelRaw = text.slice(openBracket + 1, closeBracket);
  const rawDest = text.slice(closeBracket + 2, closeParen).trim();
  const destToken =
    rawDest.startsWith("<") && rawDest.endsWith(">")
      ? rawDest.slice(1, -1).trim()
      : (rawDest.split(/\s+/)[0] ?? "");
  const safeHref = toSafeHttpUrl(destToken, { allowRelative: true });

  const children = isImage
    ? [{ type: "text" as const, value: labelRaw || safeHref || "" }]
    : parseMarkdownInlines(labelRaw, depth + 1);

  if (!safeHref) {
    return {
      node: { type: "text", value: labelRaw },
      nextIndex: closeParen + 1,
    };
  }

  return {
    node: { type: "link", href: safeHref, children },
    nextIndex: closeParen + 1,
  };
}

function parseAutoUrlAt(
  text: string,
  start: number,
): { node: MarkdownInline; nextIndex: number } | null {
  if (!text.startsWith("http://", start) && !text.startsWith("https://", start)) return null;
  if (start > 0 && /[\w<]/.test(text[start - 1])) return null;

  let end = start;
  while (end < text.length && !/[\s<>"']/.test(text[end])) {
    end += 1;
  }
  let candidate = text.slice(start, end);
  while (candidate.length > 0 && /[.,;:!?]/.test(candidate.at(-1) ?? "")) {
    candidate = candidate.slice(0, -1);
  }
  while (candidate.endsWith(")") || candidate.endsWith("]")) {
    const ch = candidate.at(-1)!;
    const open = ch === ")" ? "(" : "[";
    const openCount = candidate.split(open).length - 1;
    const closeCount = candidate.split(ch).length - 1;
    if (closeCount > openCount) {
      candidate = candidate.slice(0, -1);
    } else {
      break;
    }
  }

  const safe = toSafeHttpUrl(candidate, { allowRelative: false });
  if (!safe) return null;
  return {
    node: { type: "link", href: safe, children: [{ type: "text", value: candidate }] },
    nextIndex: start + candidate.length,
  };
}

/**
 * Phân tích định dạng inline Markdown (`**bold**`, `*italic*`, `` `code` ``, `~~strike~~`, `[text](url)`),
 * tự bỏ qua `_` bên trong từ/lệnh (`/xoa_lich_su`) và chặn URL nguy hiểm qua `toSafeHttpUrl`.
 *
 * @param text - Chuỗi một dòng cần phân tích.
 * @param depth - Độ sâu đệ quy hiện tại.
 * @returns Danh sách nút inline an toàn.
 */
export function parseMarkdownInlines(text: string, depth = 0): MarkdownInline[] {
  if (!text) return [];
  if (depth >= MAX_INLINE_DEPTH) return [{ type: "text", value: text }];

  const out: MarkdownInline[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === "\\" && i + 1 < text.length && ESCAPABLE_CHARS.has(text[i + 1])) {
      pushText(out, text[i + 1]);
      i += 2;
      continue;
    }

    if (ch === "`") {
      const ticks = countSameChar(text, i, "`");
      const closeIdx = text.indexOf("`".repeat(ticks), i + ticks);
      if (closeIdx !== -1 && closeIdx > i + ticks) {
        out.push({ type: "code", value: text.slice(i + ticks, closeIdx) });
        i = closeIdx + ticks;
        continue;
      }
    }

    if (ch === "[" || (ch === "!" && text[i + 1] === "[")) {
      const parsedLink = parseLinkAt(text, i, depth);
      if (parsedLink) {
        if (parsedLink.node.type === "text") pushText(out, parsedLink.node.value);
        else out.push(parsedLink.node);
        i = parsedLink.nextIndex;
        continue;
      }
    }

    if (ch === "h") {
      const parsedUrl = parseAutoUrlAt(text, i);
      if (parsedUrl) {
        out.push(parsedUrl.node);
        i = parsedUrl.nextIndex;
        continue;
      }
    }

    if (ch === "~" && text[i + 1] === "~") {
      const closeIdx = findClosingToken(text, i + 2, "~~", { disallowInnerEdgeSpace: true });
      if (closeIdx !== -1) {
        out.push({
          type: "strike",
          children: parseMarkdownInlines(text.slice(i + 2, closeIdx), depth + 1),
        });
        i = closeIdx + 2;
        continue;
      }
    }

    if (ch === "*" || ch === "_") {
      const isUnderscore = ch === "_";
      const run = countSameChar(text, i, ch);
      if (!isUnderscore || isWordBoundaryLeft(text, i)) {
        if (run >= 3) {
          const token = ch.repeat(3);
          const closeIdx = findClosingToken(text, i + 3, token, {
            requireWordBoundary: isUnderscore,
            disallowInnerEdgeSpace: true,
          });
          if (closeIdx !== -1) {
            out.push({
              type: "boldItalic",
              children: parseMarkdownInlines(text.slice(i + 3, closeIdx), depth + 1),
            });
            i = closeIdx + 3;
            continue;
          }
        }
        if (run >= 2) {
          const token = ch.repeat(2);
          const closeIdx = findClosingToken(text, i + 2, token, {
            requireWordBoundary: isUnderscore,
            disallowInnerEdgeSpace: true,
          });
          if (closeIdx !== -1) {
            out.push({
              type: "bold",
              children: parseMarkdownInlines(text.slice(i + 2, closeIdx), depth + 1),
            });
            i = closeIdx + 2;
            continue;
          }
        }
        if (run === 1 && i + 1 < text.length && !/\s/.test(text[i + 1])) {
          const closeIdx = findClosingToken(text, i + 1, ch, {
            requireWordBoundary: isUnderscore,
            disallowInnerEdgeSpace: true,
          });
          if (closeIdx !== -1) {
            out.push({
              type: "italic",
              children: parseMarkdownInlines(text.slice(i + 1, closeIdx), depth + 1),
            });
            i = closeIdx + 1;
            continue;
          }
        }
      }
    }

    pushText(out, ch);
    i += 1;
  }

  return out;
}

function splitTableCells(line: string): string[] {
  const cells: string[] = [];
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|") && !trimmed.endsWith("\\|")) trimmed = trimmed.slice(0, -1);

  let current = "";
  for (let i = 0; i < trimmed.length; i += 1) {
    if (trimmed[i] === "\\" && trimmed[i + 1] === "|") {
      current += "|";
      i += 1;
      continue;
    }
    if (trimmed[i] === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += trimmed[i];
  }
  cells.push(current.trim());
  return cells;
}

function parseTableAlignments(separatorLine: string): MarkdownTableAlign[] {
  return splitTableCells(separatorLine).map((cell) => {
    const starts = cell.startsWith(":");
    const ends = cell.endsWith(":");
    if (starts && ends) return "center";
    if (ends) return "right";
    return "left";
  });
}

function isTableStart(lines: string[], idx: number): boolean {
  if (idx + 1 >= lines.length) return false;
  const header = lines[idx];
  const separator = lines[idx + 1];
  if (!header.includes("|") || !separator.includes("|")) return false;
  if (!TABLE_SEPARATOR_REGEX.test(separator)) return false;
  return splitTableCells(header).length === splitTableCells(separator).length;
}

function isListItemLine(line: string): boolean {
  return !HR_REGEX.test(line) && LIST_ITEM_REGEX.test(line);
}

function isBlockStarter(lines: string[], idx: number): boolean {
  const line = lines[idx];
  if (!line.trim()) return true;
  if (FENCE_OPEN_REGEX.test(line)) return true;
  if (HR_REGEX.test(line)) return true;
  if (HEADING_REGEX.test(line)) return true;
  if (BLOCKQUOTE_REGEX.test(line)) return true;
  if (isTableStart(lines, idx)) return true;
  if (isListItemLine(line)) return true;
  return false;
}

function parseListBlock(
  lines: string[],
  startIdx: number,
  baseIndent: number,
): { block: Extract<MarkdownBlock, { type: "list" }>; nextIndex: number } {
  const firstMatch = lines[startIdx].match(LIST_ITEM_REGEX)!;
  const ordered = Boolean(firstMatch[3]);
  const start = firstMatch[3] ? Number.parseInt(firstMatch[3], 10) : 1;
  const items: MarkdownListItem[] = [];
  let idx = startIdx;

  while (idx < lines.length) {
    const line = lines[idx];
    if (!line.trim()) {
      const nextLine = lines[idx + 1];
      if (nextLine && isListItemLine(nextLine)) {
        const nextMatch = nextLine.match(LIST_ITEM_REGEX)!;
        if (nextMatch[1].length >= baseIndent && Boolean(nextMatch[3]) === ordered) {
          idx += 1;
          continue;
        }
      }
      break;
    }

    if (HR_REGEX.test(line)) break;
    const match = line.match(LIST_ITEM_REGEX);
    if (match) {
      const indent = match[1].length;
      const itemOrdered = Boolean(match[3]);
      if (indent < baseIndent) break;
      if (indent === baseIndent && itemOrdered !== ordered) break;

      if (indent > baseIndent) {
        const lastItem = items.at(-1);
        if (lastItem) {
          const nested = parseListBlock(lines, idx, indent);
          lastItem.children = nested.block;
          idx = nested.nextIndex;
          continue;
        }
      }

      let rawBody = match[4];
      let checked: boolean | undefined;
      if (!ordered) {
        const taskMatch = rawBody.match(TASK_PREFIX_REGEX);
        if (taskMatch) {
          checked = taskMatch[1].toLowerCase() === "x";
          rawBody = taskMatch[2];
        }
      }

      items.push({
        lines: [parseMarkdownInlines(rawBody)],
        checked,
      });
      idx += 1;
      continue;
    }

    const leadingSpaces = line.length - line.trimStart().length;
    if (leadingSpaces > baseIndent && items.length > 0 && !FENCE_OPEN_REGEX.test(line)) {
      items.at(-1)!.lines.push(parseMarkdownInlines(line.trim()));
      idx += 1;
      continue;
    }

    break;
  }

  return {
    block: { type: "list", ordered, start, items },
    nextIndex: idx,
  };
}

function stripTrailingHashes(text: string): string {
  return text.replace(/\s+#+\s*$/, "").trim();
}

function parseLinesToBlocks(lines: string[]): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx];
    if (!line.trim()) {
      idx += 1;
      continue;
    }

    const fenceMatch = line.match(FENCE_OPEN_REGEX);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const fenceChar = fence[0];
      const language = fenceMatch[2] ?? "";
      const codeLines: string[] = [];
      idx += 1;
      while (idx < lines.length) {
        const closeLine = lines[idx].trim();
        if (
          closeLine.startsWith(fenceChar.repeat(fence.length)) &&
          closeLine.replaceAll(fenceChar, "") === ""
        ) {
          idx += 1;
          break;
        }
        codeLines.push(lines[idx]);
        idx += 1;
      }
      blocks.push({ type: "code", language, content: codeLines.join("\n") });
      continue;
    }

    if (HR_REGEX.test(line)) {
      blocks.push({ type: "hr" });
      idx += 1;
      continue;
    }

    const headingMatch = line.match(HEADING_REGEX);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({
        type: "heading",
        level,
        inlines: parseMarkdownInlines(stripTrailingHashes(headingMatch[2])),
      });
      idx += 1;
      continue;
    }

    if (BLOCKQUOTE_REGEX.test(line)) {
      const quoteLines: string[] = [];
      while (idx < lines.length) {
        const qMatch = lines[idx].match(BLOCKQUOTE_REGEX);
        if (!qMatch) break;
        quoteLines.push(qMatch[1]);
        idx += 1;
      }
      blocks.push({ type: "blockquote", blocks: parseLinesToBlocks(quoteLines) });
      continue;
    }

    if (isTableStart(lines, idx)) {
      const headers = splitTableCells(lines[idx]).map((cell) => parseMarkdownInlines(cell));
      const alignments = parseTableAlignments(lines[idx + 1]);
      const colCount = headers.length;
      const rows: MarkdownInline[][][] = [];
      idx += 2;
      while (idx < lines.length && lines[idx].trim() && lines[idx].includes("|")) {
        const rawCells = splitTableCells(lines[idx]).slice(0, colCount);
        while (rawCells.length < colCount) rawCells.push("");
        rows.push(rawCells.map((cell) => parseMarkdownInlines(cell)));
        idx += 1;
      }
      blocks.push({ type: "table", headers, alignments, rows });
      continue;
    }

    if (isListItemLine(line)) {
      const baseIndent = (line.match(LIST_ITEM_REGEX)?.[1] ?? "").length;
      const parsedList = parseListBlock(lines, idx, baseIndent);
      blocks.push(parsedList.block);
      idx = parsedList.nextIndex;
      continue;
    }

    const paragraphLines: MarkdownInline[][] = [];
    while (idx < lines.length && !isBlockStarter(lines, idx)) {
      paragraphLines.push(parseMarkdownInlines(lines[idx]));
      idx += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraphLines });
    }
  }

  return blocks;
}

/**
 * Chuyển đổi văn bản Markdown thành danh sách khối AST thuần TypeScript (không sinh HTML thô).
 * Giữ ngắt dòng đơn trong đoạn văn để tương thích cả văn bản phản hồi của AI lẫn slash command.
 *
 * @param markdown - Chuỗi Markdown đầu vào.
 * @returns Mảng `MarkdownBlock` có cấu trúc.
 */
export function parseMarkdown(markdown: string): MarkdownBlock[] {
  if (!markdown) return [];
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n").slice(0, MAX_PARSE_LINES);
  return parseLinesToBlocks(lines);
}

/** Chuyển danh sách node inline Markdown thành văn bản thuần để sao chép bảng/ô. */
export function markdownInlinesToText(nodes: MarkdownInline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
        case "code":
          return node.value;
        case "bold":
        case "italic":
        case "boldItalic":
        case "strike":
        case "link":
          return markdownInlinesToText(node.children);
      }
    })
    .join("");
}

/** Xuất khối bảng Markdown sang dạng TSV (tab-separated) dễ dán vào Excel, Google Sheets hoặc văn bản. */
export function markdownTableToText(block: Extract<MarkdownBlock, { type: "table" }>): string {
  const cleanCell = (nodes: MarkdownInline[]) =>
    markdownInlinesToText(nodes)
      .replace(/[\r\n\t]+/g, " ")
      .trim();
  const headerLine = block.headers.map(cleanCell).join("\t");
  const rowLines = block.rows.map((row) => row.map(cleanCell).join("\t"));
  return [headerLine, ...rowLines].join("\n");
}
