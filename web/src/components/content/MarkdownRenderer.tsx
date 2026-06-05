"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownRendererProps {
  content: string;
  dir?: "ltr" | "rtl";
  className?: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ content, dir = "ltr", className }: MarkdownRendererProps) {
  return (
    <div dir={dir} className={className ?? "md"}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
          h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
          p: ({ children }) => <p className="md-p">{children}</p>,
          ul: ({ children }) => <ul className="md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="md-ul" style={{ listStyleType: "decimal" }}>{children}</ol>,
          strong: ({ children }) => <strong>{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          code({ className: codeClass, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClass ?? "");
            if (match) {
              return (
                <div className="md-mathblock" dir="ltr">
                  <SyntaxHighlighter
                    style={vscDarkPlus as Record<string, React.CSSProperties>}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ borderRadius: "var(--r)", fontSize: "0.875rem" }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return <code className="md-code" {...props}>{children}</code>;
          },
          img: ({ src, alt }) => (
            <figure className="md-figure">
              <img src={src} alt={alt ?? ""} className="md-img" />
              {alt && <figcaption className="md-caption">{alt}</figcaption>}
            </figure>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "18px 0" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.9rem" }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ border: "1px solid var(--accent-line)", padding: "8px 12px", background: "var(--accent-tint)", fontWeight: 600, textAlign: "inherit" }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ border: "1px solid var(--accent-line)", padding: "8px 12px", textAlign: "inherit" }}>
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <div
              style={{
                margin: "18px 0",
                padding: "14px 18px",
                borderInlineStart: "3px solid var(--accent-line)",
                background: "var(--accent-tint)",
                borderRadius: "var(--r-sm)",
                color: "var(--ink-2)",
              }}
            >
              {children}
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
