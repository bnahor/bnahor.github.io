/**
 * Minimal inline-markdown renderer for note bodies: bold, italic, code and
 * links. Deliberately tiny — note markdown is authored, not adversarial —
 * and it builds React nodes directly, so no HTML injection is possible.
 */
import type { ReactNode } from 'react';

const INLINE = /\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)/g;

export function InlineMarkdown({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key++} className="note-code">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link?.[1] !== undefined && link[2] !== undefined) {
        nodes.push(
          <a key={key++} className="ln" href={link[2]} target="_blank" rel="noreferrer">
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    last = index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <>{nodes}</>;
}

/**
 * Renders the lines of one note block. Consecutive bullet lines group into a
 * list; everything else is a paragraph.
 */
export function NoteLines({ lines }: { lines: string[] }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={key++} className="note-list">
        {items.map((item, i) => (
          <li key={i}>
            <InlineMarkdown text={item} />
          </li>
        ))}
      </ul>,
    );
  };

  for (const line of lines) {
    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    if (bullet?.[1] !== undefined) {
      bullets.push(bullet[1]);
      continue;
    }
    flushBullets();
    if (line.trim() !== '') {
      blocks.push(
        <p key={key++} className="note-p">
          <InlineMarkdown text={line} />
        </p>,
      );
    }
  }
  flushBullets();

  return <>{blocks}</>;
}
