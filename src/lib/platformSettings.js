"use client";

import { createContext, useContext, useState } from "react";

const defaultSettings = {
  feePerItem: 500,
  feePerTicket: 2000,
  paymentChannels: ["Paystack", "Opay"],
};

const PlatformSettingsContext = createContext(null);

export function PlatformSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  const updateSettings = (updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <PlatformSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const ctx = useContext(PlatformSettingsContext);
  if (!ctx) throw new Error("usePlatformSettings must be used within PlatformSettingsProvider");
  return ctx;
}

export { defaultSettings };
