"use client";

import katex from "katex";

interface InlineLatexProps {
  text: string;
  className?: string;
}

// Splits a string on $...$ delimiters and renders math spans with KaTeX.
export function InlineLatex({ text, className }: InlineLatexProps) {
  const parts: React.ReactNode[] = [];
  const regex = /\$([^$]+)\$/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const html = katex.renderToString(match[1], { throwOnError: false, output: "html" });
    parts.push(
      <span
        key={match.index}
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ display: "inline" }}
      />
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return <span className={className}>{parts}</span>;
}
