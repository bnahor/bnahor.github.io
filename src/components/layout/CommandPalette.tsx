import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { profile } from '../../data/profile';
import { getVisiblePosts } from '../../utils/blog';
import { useContact } from '../contactContext';

type PaletteCommand = {
  id: string;
  label: string;
  hint: string;
  run: () => void;
};

export function CommandPalette() {
  const navigate = useNavigate();
  const { openContact } = useContact();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const commands = useMemo<PaletteCommand[]>(() => {
    const postCommands = getVisiblePosts().slice(0, 8).map((post) => ({
      id: `post-${post.slug}`,
      label: `Read: ${post.title}`,
      hint: 'Blog post',
      run: () => navigate(`/blog/${post.slug}`),
    }));

    const resumeUrl = profile.links.resume.startsWith('http')
      ? profile.links.resume
      : `${import.meta.env.DEV ? '/' : import.meta.env.BASE_URL}${profile.links.resume.replace(/^\//, '')}`;

    return [
      {
        id: 'home',
        label: 'Go to home',
        hint: 'Navigation',
        run: () => navigate('/'),
      },
      {
        id: 'blog',
        label: 'Open blog',
        hint: 'Navigation',
        run: () => navigate('/blog'),
      },
      {
        id: 'projects',
        label: 'Jump to projects',
        hint: 'Section',
        run: () => navigate('/?section=projects'),
      },
      {
        id: 'open-source',
        label: 'Jump to open source activity',
        hint: 'Section',
        run: () => navigate('/?section=open-source'),
      },
      {
        id: 'thoughts',
        label: 'Jump to latest thoughts',
        hint: 'Section',
        run: () => navigate('/?section=latest-thoughts'),
      },
      {
        id: 'resume',
        label: 'Open resume PDF',
        hint: 'Action',
        run: () => window.open(resumeUrl, '_blank', 'noopener,noreferrer'),
      },
      {
        id: 'contact',
        label: 'Say hi over email',
        hint: 'Action',
        run: openContact,
      },
      {
        id: 'github',
        label: 'Open GitHub profile',
        hint: 'External',
        run: () => window.open(profile.links.github, '_blank', 'noopener,noreferrer'),
      },
      ...postCommands,
    ];
  }, [navigate, openContact]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return commands;
    return commands.filter((command) => command.label.toLowerCase().includes(value));
  }, [commands, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isPaletteShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isPaletteShortcut) {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    const onOpen = () => setOpen(true);
    const onOpenListener = onOpen as EventListener;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onOpenListener);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onOpenListener);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  if (!open) return null;

  function runCommand(command: PaletteCommand) {
    command.run();
    setOpen(false);
  }

  function handlePaletteKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (filtered.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && filtered[activeIndex]) {
      event.preventDefault();
      runCommand(filtered[activeIndex]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onKeyDown={handlePaletteKeyDown}
    >
      <div className="mx-auto mt-[11vh] w-[min(720px,calc(100vw-1.5rem))] rounded-lg border border-line bg-surface p-3 shadow-panel">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search commands, sections, and posts..."
          autoFocus
          className="w-full rounded-md border border-line bg-black/25 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
        />

        <ul className="mt-2 max-h-[55vh] overflow-y-auto" role="listbox" aria-label="Available commands">
          {filtered.length > 0 ? (
            filtered.map((command, index) => (
              <li key={command.id}>
                <button
                  type="button"
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  onClick={() => {
                    runCommand(command);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition ${
                    activeIndex === index ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-sm text-text-primary">{command.label}</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-text-muted">{command.hint}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-4 text-sm text-text-muted">No matching command. Try another keyword.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
