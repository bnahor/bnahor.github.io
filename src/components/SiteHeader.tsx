import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { profile } from '../data/profile';

const navItems = [
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Rohan Bahl, back to top">
        <span className="wordmark-mark" aria-hidden="true">
          <i />
        </span>
        <span className="wordmark-name">Rohan Bahl</span>
      </a>

      <nav className="site-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} className="nav-link" href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <a className="header-resume" href={profile.links.resume} target="_blank" rel="noreferrer">
        Résumé
        <Icon name="arrowRight" size={14} />
      </a>

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
      </button>

      {menuOpen && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              className="mobile-nav-link"
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            className="mobile-nav-link mobile-nav-link--resume"
            href={profile.links.resume}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            Résumé
            <Icon name="arrowRight" size={14} />
          </a>
        </nav>
      )}
    </header>
  );
}
