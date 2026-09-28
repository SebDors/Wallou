import React, { createContext, useContext, useState, useCallback } from 'react';
import { QuickEntryModal } from '../components/QuickEntryModal';

export interface QuickEntryContextType {
  isOpen: boolean;
  openQuickEntry: () => void;
  closeQuickEntry: () => void;
}

const QuickEntryContext = createContext<QuickEntryContextType | undefined>(undefined);

export const QuickEntryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openQuickEntry = useCallback(() => setIsOpen(true), []);
  const closeQuickEntry = useCallback(() => setIsOpen(false), []);

  return (
    <QuickEntryContext.Provider value={{ isOpen, openQuickEntry, closeQuickEntry }}>
      {children}
      <QuickEntryModal visible={isOpen} onClose={closeQuickEntry} />
    </QuickEntryContext.Provider>
  );
};

export function useQuickEntry(): QuickEntryContextType {
  const context = useContext(QuickEntryContext);
  if (!context) {
    throw new Error('useQuickEntry must be used within a QuickEntryProvider');
  }
  return context;
}
