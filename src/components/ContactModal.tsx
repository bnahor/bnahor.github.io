import { FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { EXTERNAL } from '../config/external';
import { smooth } from '../utils/motionPresets';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => firstFieldRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSubmitState('idle');
    }
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState === 'submitting') return;

    setSubmitState('submitting');
    const form = event.currentTarget;

    try {
      const response = await fetch(EXTERNAL.FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error('Request failed');

      setSubmitState('success');
      form.reset();
      window.setTimeout(() => {
        onClose();
        setSubmitState('idle');
      }, 1800);
    } catch {
      setSubmitState('error');
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          aria-labelledby="contact-title"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <m.div
            ref={dialogRef}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={smooth}
            role="document"
            className="relative w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-panel"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 id="contact-title" className="font-display text-xl text-text-primary">Say hi</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-2 py-1 text-sm text-text-muted transition hover:bg-white/[0.04] hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                Close
              </button>
            </div>

            <p className="text-sm text-text-muted mb-5">
              Prefer concise intros. A short note with role context is enough.
            </p>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-1.5">
                <label htmlFor="modal-name" className="text-xs text-text-muted">Name</label>
                <input
                  id="modal-name"
                  name="name"
                  type="text"
                  required
                  ref={firstFieldRef}
                  className="rounded-md border border-line bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="modal-email" className="text-xs text-text-muted">Email</label>
                <input
                  id="modal-email"
                  name="email"
                  type="email"
                  required
                  className="rounded-md border border-line bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="modal-message" className="text-xs text-text-muted">Message</label>
                <textarea
                  id="modal-message"
                  name="message"
                  rows={4}
                  required
                  className="resize-none rounded-md border border-line bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-brand/50 focus:ring-2 focus:ring-brand/15"
                />
              </div>

              <button
                type="submit"
                disabled={submitState === 'submitting'}
                className="w-fit rounded-md border border-brand/40 bg-brand/10 px-5 py-2.5 text-sm font-medium text-brand transition hover:bg-brand/20 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitState === 'submitting' ? 'Sending...' : 'Send message'}
              </button>

              <p aria-live="polite" className="text-xs text-text-muted">
                {submitState === 'success' && 'Message sent successfully.'}
                {submitState === 'error' && 'Message failed to send. Please email directly.'}
              </p>
            </form>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
