import React, { createContext, useContext, useState } from 'react';
import { TransformationType } from '../lib/transformations';

interface Settings {
  transformationType: TransformationType;
  autoPrint: boolean;
  printSize: '6x9' | '8x10';
  printDPI: number;
  previewEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  transformationType: 'pencil',
  autoPrint: false,
  printSize: '8x10',
  printDPI: 300,
  previewEnabled: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};