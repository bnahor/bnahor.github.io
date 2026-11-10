import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { profile } from '../data/profile';

const writingItem = { label: 'Writing', href: '#/blog' };

const navItems = [
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  writingItem,
  { label: 'Reading', href: '#/shelf' },
  { label: 'Contact', href: '#contact' },
];

const sectionIds = navItems.flatMap((item) => (item.href.startsWith('#/') ? [] : [item.href.slice(1)]));

/** The section under the reading line, or the last one once the page bottoms out. */
function currentSection(): string | null {
  const line = window.innerHeight * 0.4;
  const atEnd =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let found: string | null = null;
  for (const id of sectionIds) {
    const rect = document.getElementById(id)?.getBoundingClientRect();
    if (!rect) continue;
    if ((rect.top <= line && rect.bottom > line) || atEnd) found = id;
  }
  return found;
}

/** The page's own title carries the name at the top of the homepage. */
function useHeaderState() {
  const [onStage, setOnStage] = useState(false);
  const [nameInView, setNameInView] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const title = document.getElementById('hero-heading');
    if (!title) return;
    const io = new IntersectionObserver(([entry]) => setNameInView(entry?.isIntersecting ?? false), {
      rootMargin: '-56px 0px 0px 0px',
    });
    io.observe(title);
    let frame = 0;
    const update = () => {
      frame = 0;
      setOnStage(window.scrollY < 24);
      setCurrent(currentSection());
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { onStage, nameInView, current };
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [hasPosts, setHasPosts] = useState(false);
  const { onStage, nameInView, current } = useHeaderState();

  // The Writing link appears by itself once a post is published.
  useEffect(() => {
    let alive = true;
    import('../blog/posts').then((mod) => alive && setHasPosts(mod.posts.length > 0));
    return () => {
      alive = false;
    };
  }, []);

  const items = navItems.filter((item) => hasPosts || item !== writingItem);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    // The overlay covers the page, so the document behind it must not scroll
    // and must not be reachable by Tab.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
      );

    // Focus the panel rather than the first link: it still moves screen readers
    // into the menu, without painting a focus ring on a link the user tapped.
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      const tabbable = [...focusables(), toggleRef.current].filter(Boolean) as HTMLElement[];
      const first = tabbable[0];
      const last = tabbable[tabbable.length - 1];
      if (!first || !last) return;

      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      <header className={`site-bar${onStage && !menuOpen ? ' is-clear' : ''}`}>
        <a
          className={`wordmark${nameInView && !menuOpen ? ' is-hidden' : ''}`}
          href="#top"
          aria-label="Rohan Bahl, back to top"
        >
          {profile.name}
        </a>

        <nav className="site-nav" aria-label="Primary">
          {items.map((item) => (
            <a
              key={item.href}
              className={`nav-link${current && item.href === `#${current}` ? ' is-current' : ''}`}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
          <a className="nav-link nav-link--resume" href={profile.links.resume} target="_blank" rel="noreferrer">
            Résumé
          </a>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
        >
          <span key={String(menuOpen)} className="menu-icon">
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </span>
        </button>
      </header>

      {menuOpen && (
        <nav
          ref={panelRef}
          id="mobile-nav"
          className="mobile-nav"
          aria-label="Primary"
          tabIndex={-1}
        >
          <ul className="mobile-nav-list">
            {items.map((item) => (
              <li key={item.href}>
                <a className="mobile-nav-link" href={item.href} onClick={closeMenu}>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                className="mobile-nav-link"
                href={profile.links.resume}
                target="_blank"
                rel="noreferrer"
                onClick={closeMenu}
              >
                Résumé
              </a>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
