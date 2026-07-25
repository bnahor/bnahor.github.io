import { profile } from '../../data/profile';
import { useContact } from '../contactContext';

export function Footer() {
  const { openContact } = useContact();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] py-8 md:w-[min(1120px,calc(100%-3rem))] md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div>
            <span className="font-display text-text-primary">{profile.name}</span>
            <p className="mt-1 text-xs text-text-muted">© {new Date().getFullYear()} / built as a working portfolio system</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-text-muted">
            <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="transition hover:text-brand">
              GitHub
            </a>
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="transition hover:text-brand">
              LinkedIn
            </a>
            <button
              type="button"
              onClick={openContact}
              className="transition hover:text-brand"
            >
              Say hi
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
