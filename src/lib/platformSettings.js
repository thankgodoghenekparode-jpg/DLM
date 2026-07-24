"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

const defaultSettings = {
  feePerItem: 500,
  feePerTicket: 2000,
  paymentChannels: ["Paystack", "Opay"],
};

const PlatformSettingsContext = createContext(null);

export function PlatformSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.get("/platform/settings");
        setSettings({
          feePerItem: data.feePerItem ?? defaultSettings.feePerItem,
          feePerTicket: data.feePerTicket ?? defaultSettings.feePerTicket,
          paymentChannels: data.paymentChannels?.length ? data.paymentChannels : defaultSettings.paymentChannels,
        });
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const updateSettings = async (updates) => {
    const data = await api.patch("/platform/settings", updates);
    setSettings((prev) => ({ ...prev, ...data }));
    return data;
  };

  return (
    <PlatformSettingsContext.Provider value={{ settings, updateSettings, loading }}>
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