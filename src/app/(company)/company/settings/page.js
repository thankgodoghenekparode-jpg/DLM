"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { usePlatformSettings } from "@/lib/platformSettings";
import Button from "@/components/shared/Button";
import { Globe, Receipt, CreditCard, CheckCircle, Loader2 } from "lucide-react";

export default function CompanySettingsPage() {
  const { settings, loading: settingsLoading } = usePlatformSettings();
  const [currency, setCurrency] = useState("NGN");
  const [timezone, setTimezone] = useState("WAT (UTC+1)");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanySettings() {
      try {
        const me = await api.get("/auth/me");
        if (me?.tenant?.settings) {
          if (me.tenant.settings.currency) setCurrency(me.tenant.settings.currency);
          if (me.tenant.settings.timezone) setTimezone(me.tenant.settings.timezone);
          if (me.tenant.settings.dateFormat) setDateFormat(me.tenant.settings.dateFormat);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchCompanySettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/me", { settings: { currency, timezone, dateFormat } });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || settingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe size={16} /> Regional</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="text-xs text-gray-500">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
              <option>NGN (₦)</option><option>USD ($)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
              <option>WAT (UTC+1)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Date Format</label>
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
              <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Receipt size={16} /> Fees & Charges</h3>
        <p className="text-xs text-gray-500 mb-3">Platform-wide fees configured by the platform admin.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Fee per Item</p>
            <p className="text-lg font-bold text-gray-900">₦{settings.feePerItem.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500">Fee per Ticket</p>
            <p className="text-lg font-bold text-gray-900">₦{settings.feePerTicket.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard size={16} /> Payment Channels</h3>
        <p className="text-xs text-gray-500 mb-3">Enabled payment channels for your wallet transactions.</p>
        <div className="flex flex-wrap gap-2">
          {settings.paymentChannels.map((ch) => (
            <span key={ch} className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg">{ch}</span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 items-center">
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Settings saved</span>}
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
      </div>
    </div>
  );
}