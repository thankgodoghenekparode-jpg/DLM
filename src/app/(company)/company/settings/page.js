"use client";

import Button from "@/components/shared/Button";
import { usePlatformSettings } from "@/lib/platformSettings";
import { Globe, Receipt, CreditCard } from "lucide-react";

export default function CompanySettingsPage() {
  const { settings } = usePlatformSettings();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe size={16} /> Regional</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div><label className="text-xs text-gray-500">Currency</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"><option>NGN (₦)</option><option>USD ($)</option></select></div>
          <div><label className="text-xs text-gray-500">Timezone</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"><option>WAT (UTC+1)</option></select></div>
          <div><label className="text-xs text-gray-500">Date Format</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option></select></div>
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

      <div className="flex justify-end"><Button onClick={() => alert("Settings saved")}>Save Settings</Button></div>
    </div>
  );
}
