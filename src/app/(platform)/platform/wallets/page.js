"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Link from "next/link";
import { Wallet, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function PlatformWalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/platform/wallets")
      .then((data) => { setWallets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { setError(err.message || "Failed to load wallets"); setLoading(false); });
  }, []);

  const formatCurrency = (amount, currency) => {
    if (currency === "NGN") return `₦${(amount || 0).toLocaleString()}`;
    return `${currency || "₦"}${(amount || 0).toLocaleString()}`;
  };

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance?.amount || 0), 0);
  const primaryCurrency = wallets[0]?.balance?.currency || "NGN";

  const columns = [
    { header: "Company", accessor: "tenantName", sortable: true, render: (row) => <Link href={`/platform/wallets/${row.tenantId || row.id}`} className="text-primary hover:underline font-medium">{row.tenantName}</Link> },
    { header: "Balance", accessor: "balance", sortable: true, render: (row) => formatCurrency(row.balance?.amount, row.balance?.currency) },
    { header: "Last Updated", accessor: "updatedAt", sortable: true, render: (row) => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-sm">{error}</p>
        <button className="mt-3 px-4 py-2 bg-primary text-white text-sm rounded-lg" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wallets</h1>
          <p className="text-sm text-gray-500 mt-1">Oversee all company wallets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-primary" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance, primaryCurrency)}</p><p className="text-xs text-gray-500">Total Wallet Balance</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-2xl font-bold text-gray-900">{wallets.length}</p><p className="text-xs text-gray-500">Total Wallets</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns} data={wallets} searchable />
      </div>
    </div>
  );
}
