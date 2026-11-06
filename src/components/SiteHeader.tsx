import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { profile } from '../data/profile';

const blogItem = { label: 'Blog', href: '#/blog' };

const navItems = [
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  blogItem,
  { label: 'Shelf', href: '#/shelf' },
  { label: 'Library', href: '#/library' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [hasPosts, setHasPosts] = useState(false);

  // The Blog link appears by itself once a post is published.
  useEffect(() => {
    let alive = true;
    import('../blog/posts').then((mod) => alive && setHasPosts(mod.posts.length > 0));
    return () => {
      alive = false;
    };
  }, []);

  const items = navItems.filter((item) => hasPosts || item !== blogItem);

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

      const items = [...focusables(), toggleRef.current].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
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
      <header className="site-bar">
        <a className="wordmark" href="#top" aria-label="Rohan Bahl, back to top">
          Rohan Bahl
        </a>

        <nav className="site-nav" aria-label="Primary">
          {items.map((item) => (
            <a key={item.href} className="nav-link" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-resume" href={profile.links.resume} target="_blank" rel="noreferrer">
          Résumé
        </a>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
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
          </ul>

          <div className="mobile-nav-foot">
            <a
              className="mobile-nav-resume"
              href={profile.links.resume}
              target="_blank"
              rel="noreferrer"
              onClick={closeMenu}
            >
              Résumé
              <Icon name="arrowRight" size={15} />
            </a>
            <a className="mobile-nav-email" href={`mailto:${profile.email}`} onClick={closeMenu}>
              {profile.email}
            </a>
          </div>
        </nav>
      )}
    </>
  );
}
