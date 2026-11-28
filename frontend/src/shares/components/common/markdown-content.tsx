"use client";

import { Fragment, type ReactNode, useMemo } from "react";

import { Link } from "@/i18n/navigation";
import { MarkdownTableBlock } from "@/shares/components/common/markdown-table-block";
import {
  type MarkdownBlock,
  type MarkdownInline,
  type MarkdownListItem,
  markdownTableToText,
  parseMarkdown,
} from "@/shares/lib/markdown";
import { cn } from "cn";

const HEADING_CLASSES: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: "mt-1 text-base font-bold tracking-tight",
  2: "mt-1 text-[15px] font-bold tracking-tight",
  3: "mt-0.5 text-sm font-bold",
  4: "text-sm font-semibold",
  5: "text-[13px] font-semibold",
  6: "text-muted-foreground text-[13px] font-semibold",
};

function renderInlines(nodes: MarkdownInline[], keyPrefix: string): ReactNode {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.type) {
      case "text":
        return <Fragment key={key}>{node.value}</Fragment>;
      case "bold":
        return (
          <strong key={key} className="font-semibold">
            {renderInlines(node.children, key)}
          </strong>
        );
      case "italic":
        return (
          <em key={key} className="italic">
            {renderInlines(node.children, key)}
          </em>
        );
      case "boldItalic":
        return (
          <strong key={key} className="font-semibold italic">
            {renderInlines(node.children, key)}
          </strong>
        );
      case "strike":
        return (
          <del key={key} className="text-muted-foreground line-through">
            {renderInlines(node.children, key)}
          </del>
        );
      case "code":
        return (
          <code
            key={key}
            className="border-border/60 bg-background/80 text-foreground rounded border px-1 py-0.5 font-mono text-[12px]"
          >
            {node.value}
          </code>
        );
      case "link": {
        const isExternal = node.href.startsWith("http://") || node.href.startsWith("https://");
        return (
          <Link
            key={key}
            href={node.href as never}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-primary font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            {renderInlines(node.children, key)}
          </Link>
        );
      }
    }
  });
}

function renderInlineLines(lines: MarkdownInline[][], keyPrefix: string): ReactNode {
  return lines.map((line, index) => (
    <Fragment key={`${keyPrefix}-line-${index}`}>
      {index > 0 ? <br /> : null}
      {renderInlines(line, `${keyPrefix}-line-${index}`)}
    </Fragment>
  ));
}

function renderListItems(items: MarkdownListItem[], keyPrefix: string): ReactNode {
  return items.map((item, index) => {
    const key = `${keyPrefix}-li-${index}`;
    const isTask = item.checked !== undefined;
    return (
      <li key={key} className={cn("min-w-0", isTask && "-ml-4 flex list-none items-start gap-2")}>
        {isTask ? (
          <span
            aria-hidden
            className={cn(
              "mt-1 inline-flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
              item.checked
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-transparent",
            )}
          >
            ✓
          </span>
        ) : null}
        <div className={cn("min-w-0", isTask && "flex-1")}>
          <div>{renderInlineLines(item.lines, key)}</div>
          {item.children ? renderBlock(item.children, `${key}-sub`) : null}
        </div>
      </li>
    );
  });
}

function renderHeading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  inlines: MarkdownInline[],
  key: string,
): ReactNode {
  const cls = HEADING_CLASSES[level];
  const content = renderInlines(inlines, key);
  if (level === 1)
    return (
      <h1 key={key} className={cls}>
        {content}
      </h1>
    );
  if (level === 2)
    return (
      <h2 key={key} className={cls}>
        {content}
      </h2>
    );
  if (level === 3)
    return (
      <h3 key={key} className={cls}>
        {content}
      </h3>
    );
  if (level === 4)
    return (
      <h4 key={key} className={cls}>
        {content}
      </h4>
    );
  if (level === 5)
    return (
      <h5 key={key} className={cls}>
        {content}
      </h5>
    );
  return (
    <h6 key={key} className={cls}>
      {content}
    </h6>
  );
}

function renderBlock(block: MarkdownBlock, key: string): ReactNode {
  switch (block.type) {
    case "heading":
      return renderHeading(block.level, block.inlines, key);
    case "paragraph":
      return (
        <p key={key} className="leading-relaxed">
          {renderInlineLines(block.lines, key)}
        </p>
      );
    case "hr":
      return <hr key={key} className="border-border/70 my-2" />;
    case "code":
      return (
        <div
          key={key}
          className="border-border/70 bg-background/90 my-1 overflow-hidden rounded-xl border"
        >
          {block.language ? (
            <div className="border-border/50 bg-muted/60 text-muted-foreground border-b px-3 py-1 font-mono text-[11px] font-medium">
              {block.language}
            </div>
          ) : null}
          <pre className="overflow-x-auto p-2.5 font-mono text-xs leading-relaxed">
            <code>{block.content}</code>
          </pre>
        </div>
      );
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-primary/50 text-muted-foreground space-y-1.5 border-l-2 pl-3"
        >
          {block.blocks.map((inner, innerIdx) => renderBlock(inner, `${key}-q-${innerIdx}`))}
        </blockquote>
      );
    case "list": {
      if (block.ordered) {
        return (
          <ol key={key} start={block.start} className="list-decimal space-y-1 pl-5">
            {renderListItems(block.items, key)}
          </ol>
        );
      }
      return (
        <ul key={key} className="list-disc space-y-1 pl-4">
          {renderListItems(block.items, key)}
        </ul>
      );
    }
    case "table":
      return (
        <MarkdownTableBlock
          key={key}
          headers={block.headers.map((headerCell, colIdx) =>
            renderInlines(headerCell, `${key}-th-${colIdx}`),
          )}
          rows={block.rows.map((row, rowIdx) =>
            row.map((cell, colIdx) => renderInlines(cell, `${key}-td-${rowIdx}-${colIdx}`)),
          )}
          alignments={block.alignments}
          copyText={markdownTableToText(block)}
        />
      );
  }
}

/**
 * Hiển thị nội dung Markdown (heading, đậm/nghiêng, danh sách, task list, bảng GFM, blockquote, code block, link)
 * bằng phần tử React thuần có kiểm tra URL an toàn (`toSafeHttpUrl`), không dùng `dangerouslySetInnerHTML`.
 *
 * @param props - Chuỗi Markdown thô và lớp CSS bổ sung.
 * @returns Khối nội dung Markdown đã định dạng gọn gàng cho chat và mô tả đọc.
 */
export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div
      data-slot="markdown-content"
      className={cn("min-w-0 space-y-2 text-sm leading-relaxed", className)}
    >
      {blocks.map((block, index) => renderBlock(block, `md-${index}`))}
    </div>
  );
}
