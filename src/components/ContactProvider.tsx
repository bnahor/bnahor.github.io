import { useMemo, useState, type ReactNode } from 'react';
import { ContactModal } from './ContactModal';
import { ContactContext, type ContactContextValue } from './contactContext';

export function ContactProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<ContactContextValue>(
    () => ({
      openContact: () => setIsOpen(true),
      closeContact: () => setIsOpen(false),
    }),
    [],
  );

  return (
    <ContactContext.Provider value={value}>
      {children}
      <ContactModal isOpen={isOpen} onClose={value.closeContact} />
    </ContactContext.Provider>
  );
}
