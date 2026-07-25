import { createContext, useContext } from 'react';

export type ContactContextValue = {
  openContact: () => void;
  closeContact: () => void;
};

export const ContactContext = createContext<ContactContextValue | null>(null);

export function useContact() {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContact must be used within ContactProvider');
  }
  return context;
}
