"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Button from "@/components/shared/Button";
import { Globe, Bell, CreditCard, Receipt, CheckCircle, Loader2 } from "lucide-react";

export default function PlatformSettingsPage() {
  const [feePerItem, setFeePerItem] = useState("");
  const [feePerTicket, setFeePerTicket] = useState("");
  const [channels, setChannels] = useState([]);
  const [currency, setCurrency] = useState("NGN");
  const [timezone, setTimezone] = useState("WAT (UTC+1)");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const data = await api.get("/platform/settings");
        setFeePerItem(String(data.feePerItem ?? ""));
        setFeePerTicket(String(data.feePerTicket ?? ""));
        setChannels(data.paymentChannels || []);
        if (data.currency) setCurrency(data.currency);
        if (data.timezone) setTimezone(data.timezone);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const toggleChannel = (ch) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/platform/settings", {
        feePerItem: Number(feePerItem),
        feePerTicket: Number(feePerTicket),
        paymentChannels: channels,
        currency,
        timezone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure global platform preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe size={16} /> Regional</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div><label className="text-xs text-gray-500">Default Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"><option value="NGN">NGN (₦)</option><option value="USD">USD ($)</option></select></div>
          <div><label className="text-xs text-gray-500">Default Timezone</label><select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"><option>WAT (UTC+1)</option></select></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Receipt size={16} /> Fee Configuration</h3>
        <p className="text-xs text-gray-500 mb-4">Fees deducted from company wallets per item or per carriage (ticket).</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="text-xs text-gray-500">Fee per Item (₦)</label>
            <input type="number" value={feePerItem} onChange={(e) => setFeePerItem(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fee per Ticket (₦)</label>
            <input type="number" value={feePerTicket} onChange={(e) => setFeePerTicket(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Bell size={16} /> Notifications</h3>
        <div className="space-y-3">
          <p className="text-xs text-gray-500 font-medium">Platform Notifications</p>
          {["New company registration alerts", "Payment confirmation notifications", "System health alerts"].map((n, i) => (
            <label key={i} className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked className="accent-primary" />{n}</label>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-4 space-y-3">
          <p className="text-xs text-gray-500 font-medium">Company Notifications</p>
          {["Company account suspension alerts", "Plan upgrade/downgrade notices", "Wallet balance threshold alerts"].map((n, i) => (
            <label key={i} className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked className="accent-primary" />{n}</label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard size={16} /> Payment Channels</h3>
        <p className="text-xs text-gray-500 mb-3">Enable payment channels for all companies.</p>
        <div className="space-y-3">
          {["Paystack", "Opay"].map((ch) => (
            <label key={ch} className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={channels.includes(ch)} onChange={() => toggleChannel(ch)} className="accent-primary" />
              {ch}
            </label>
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