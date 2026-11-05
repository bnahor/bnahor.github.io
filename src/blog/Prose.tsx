/**
 * Block-level markdown for blog posts: headings, paragraphs, bullet and
 * numbered lists, blockquotes and fenced code. Inline formatting reuses the
 * shelf's renderer. Builds React nodes directly — no HTML injection.
 */
import type { ReactNode } from 'react';
import { InlineMarkdown } from '../learn/markdown';

export function Prose({ source }: { source: string }) {
  const lines = source.split('\n');
  const out: ReactNode[] = [];
  let key = 0;
  let i = 0;

  const collect = (test: RegExp) => {
    const items: string[] = [];
    while (i < lines.length) {
      const hit = test.exec(lines[i] ?? '');
      if (!hit) break;
      items.push(hit[1] ?? '');
      i++;
    }
    return items;
  };

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const fence = /^```(\w*)/.exec(trimmed);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith('```')) {
        code.push(lines[i] ?? '');
        i++;
      }
      i++; // closing fence
      out.push(
        <figure key={key++} className="prose-code">
          {fence[1] && <figcaption>{fence[1]}</figcaption>}
          <pre>
            <code>{code.join('\n')}</code>
          </pre>
        </figure>,
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      // A post's title is the page h1, so markdown headings start at h2.
      const level = Math.min(4, Math.max(2, (heading[1] ?? '#').length + 1));
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      out.push(
        <Tag key={key++}>
          <InlineMarkdown text={heading[2] ?? ''} />
        </Tag>,
      );
      i++;
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items = collect(/^\s*[-*+]\s+(.*)$/);
      out.push(
        <ul key={key++}>
          {items.map((item, n) => (
            <li key={n}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items = collect(/^\s*\d+[.)]\s+(.*)$/);
      out.push(
        <ol key={key++}>
          {items.map((item, n) => (
            <li key={n}>
              <InlineMarkdown text={item} />
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quote = collect(/^\s*>\s?(.*)$/);
      out.push(
        <blockquote key={key++}>
          <InlineMarkdown text={quote.join(' ')} />
        </blockquote>,
      );
      continue;
    }

    // Paragraph: consecutive non-blank lines that start no other block.
    const para: string[] = [];
    while (i < lines.length) {
      const t = (lines[i] ?? '').trim();
      if (!t || /^(```|#{1,4}\s|[-*+]\s|\d+[.)]\s|>)/.test(t)) break;
      para.push(t);
      i++;
    }
    out.push(
      <p key={key++}>
        <InlineMarkdown text={para.join(' ')} />
      </p>,
    );
  }

  return <div className="prose">{out}</div>;
}
