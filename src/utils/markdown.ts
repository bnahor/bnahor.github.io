const JS_KEYWORDS = /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|try|catch|throw|class|extends|import|from|export|new|async|await|type|interface|implements|public|private|protected|true|false|null|undefined)\b/g;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightCode(code: string): string {
  const escaped = escapeHtml(code);

  return escaped
    .replace(/(\/\/.*)$/gm, '<span class="token-comment">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="token-string">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-number">$1</span>')
    .replace(JS_KEYWORDS, '<span class="token-keyword">$1</span>');
}

function parseInline(markdown: string): string {
  let output = escapeHtml(markdown);

  output = output.replace(/`([^`]+)`/g, '<code>$1</code>');
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return output;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let blockquote: string[] = [];
  let inCode = false;
  let codeLanguage = '';
  let codeLines: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${parseInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    html.push(`<ul>${listItems.map((item) => `<li>${parseInline(item)}</li>`).join('')}</ul>`);
    listItems = [];
  };

  const flushQuote = () => {
    if (blockquote.length === 0) return;
    html.push(`<blockquote>${parseInline(blockquote.join(' '))}</blockquote>`);
    blockquote = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushList();
      flushQuote();

      if (!inCode) {
        inCode = true;
        codeLanguage = trimmed.replace('```', '').trim();
        codeLines = [];
      } else {
        const highlighted = highlightCode(codeLines.join('\n'));
        html.push(
          `<pre data-language="${escapeHtml(codeLanguage || 'text')}"><code class="language-${escapeHtml(codeLanguage || 'text')}">${highlighted}</code></pre>`,
        );
        inCode = false;
        codeLanguage = '';
        codeLines = [];
      }

      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      blockquote.push(trimmed.slice(2));
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      flushQuote();
      listItems.push(listMatch[1] ?? '');
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      const marker = headingMatch[1] ?? '#';
      const level = marker.length;
      const content = parseInline(headingMatch[2] ?? '');
      html.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushQuote();

  return html.join('\n');
}

export function estimateReadingTime(content: string): number {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[#>*_~\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return 1;
  const words = plain.split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
