"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import StatusBadge from "@/components/shared/StatusBadge";
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Minus, Settings2, History, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function WalletDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ amount: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = () => {
    api.get(`/platform/wallets/${id}`)
      .then((data) => {
        setWallet(data.wallet || data);
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setLoading(false);
      })
      .catch((err) => { setError(err.message || "Failed to load wallet"); setLoading(false); });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchWallet(); }, [id]);

  const formatCurrency = (amount, currency) => {
    if (currency === "NGN") return `₦${(amount || 0).toLocaleString()}`;
    return `${currency || "₦"}${(amount || 0).toLocaleString()}`;
  };

  const openModal = (action) => {
    setModal(action);
    setForm({ amount: "", reason: "" });
  };

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/platform/wallet-adjustments", {
        tenantId: wallet.tenantId,
        amount: Math.abs(Number(form.amount)),
        type: modal === "add" ? "CREDIT_ADJUSTMENT" : "DEBIT_ADJUSTMENT",
        reason: form.reason || `Balance ${modal === "add" ? "increase" : "decrease"} by platform`,
      });
      alert(`Balance ${modal === "add" ? "increased" : "decreased"} successfully.`);
      setModal(null);
      fetchWallet();
    } catch (err) {
      alert(err.message || "Failed to adjust balance");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!wallet) return null;

  const balanceAmount = typeof wallet.balance === "number" ? wallet.balance : wallet.balance?.amount || 0;
  const balanceCurrency = wallet.currency || "NGN";

  const totalCredits = transactions.filter((t) => (typeof t.amount === "object" ? t.amount.amount : t.amount) > 0).reduce((sum, t) => sum + (typeof t.amount === "object" ? t.amount.amount : t.amount), 0);
  const totalDebits = transactions.filter((t) => (typeof t.amount === "object" ? t.amount.amount : t.amount) < 0).reduce((sum, t) => sum + Math.abs(typeof t.amount === "object" ? t.amount.amount : t.amount), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <button onClick={() => router.push("/platform/wallets")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">← Wallets</button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">{wallet.tenantName || "Wallet"}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-primary" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{formatCurrency(balanceAmount, balanceCurrency)}</p><p className="text-xs text-gray-500">Current Balance</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><ArrowUpRight size={20} className="text-green-600" /></div>
          <div><p className="text-lg font-bold text-green-600">{formatCurrency(totalCredits, balanceCurrency)}</p><p className="text-xs text-gray-500">Total Credits</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><ArrowDownRight size={20} className="text-red-600" /></div>
          <div><p className="text-lg font-bold text-red-600">{formatCurrency(totalDebits, balanceCurrency)}</p><p className="text-xs text-gray-500">Total Debits</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Settings2 size={16} /> Balance Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => openModal("add")}><Plus size={16} className="mr-1" /> Add Balance</Button>
          <Button variant="secondary" onClick={() => openModal("reduce")}><Minus size={16} className="mr-1" /> Reduce Balance</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><History size={16} /> Transaction History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">No transactions yet</td></tr>
              )}
              {transactions.map((txn) => {
                const amt = typeof txn.amount === "object" ? txn.amount.amount : txn.amount;
                const cur = (typeof txn.amount === "object" ? txn.amount.currency : txn.currency) || balanceCurrency;
                return (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${amt >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {amt >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {amt >= 0 ? "Credit" : "Debit"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(Math.abs(amt), cur)}</td>
                    <td className="px-4 py-3 text-gray-700">{txn.description || txn.type || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              {modal === "add" ? <Plus size={18} /> : <Minus size={18} />}
              {modal === "add" ? "Add Balance" : "Reduce Balance"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Current: {formatCurrency(balanceAmount, balanceCurrency)}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount (₦)</label>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Reason for this adjustment..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : null} Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
