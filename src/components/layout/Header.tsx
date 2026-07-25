import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { m } from 'framer-motion';
import { profile } from '../../data/profile';
import { smooth } from '../../utils/motionPresets';
import { Icon } from '../Icon';
import { useContact } from '../contactContext';

function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);

export function Header() {
  const scrolled = useScrolled();
  const { openContact } = useContact();

  return (
    <m.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={smooth}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-line bg-bg/90 backdrop-blur-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-[min(1120px,calc(100%-1.5rem))] items-center justify-between py-3 md:w-[min(1120px,calc(100%-3rem))] md:py-4">
        <Link to="/" className="font-display text-base text-text-primary transition hover:text-brand md:text-lg">
          {profile.name}
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-1 sm:flex">
            {[
              { to: '/', label: 'Home' },
              { to: '/blog', label: 'Blog' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }: { isActive: boolean }) =>
                  `rounded-md px-2.5 py-1.5 text-xs transition md:text-sm ${
                    isActive
                      ? 'bg-white/[0.05] text-brand'
                      : 'text-text-muted hover:text-text-primary'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/?section=projects"
              className="rounded-md px-2.5 py-1.5 text-xs text-text-muted transition hover:text-text-primary md:text-sm"
            >
              Work
            </Link>
          </nav>

          <button
            type="button"
            onClick={openContact}
            className="hidden rounded-md border border-line px-2.5 py-1.5 text-xs text-text-muted transition hover:border-brand/30 hover:text-brand md:inline-flex"
          >
            Contact
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-text-muted transition hover:border-brand/30 hover:text-brand md:text-sm"
            onClick={() => {
              window.dispatchEvent(new Event('open-command-palette'));
            }}
          >
            <Icon name="search" size={13} />
            <kbd className="hidden font-mono text-[10px] text-text-muted md:inline-block">
              {isMac ? '⌘' : 'Ctrl'}K
            </kbd>
          </button>
        </div>
      </div>
    </m.header>
  );
}
