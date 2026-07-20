"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Minus, Settings2, History, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

function getAmount(value) {
  if (typeof value === "number") return value;
  if (typeof value?.amount === "number") return value.amount;
  return 0;
}

function getCurrency(value, fallback = "NGN") {
  return value?.currency || fallback;
}

function isDebitTransaction(txn) {
  const type = String(txn.type || "").toUpperCase();
  const amount = getAmount(txn.amount);
  return type.startsWith("DEBIT") || amount < 0;
}

function signedTransactionAmount(txn) {
  const amount = Math.abs(getAmount(txn.amount));
  return isDebitTransaction(txn) ? -amount : amount;
}

function formatCurrency(amount, currency = "NGN") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

export default function WalletDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ amount: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchWallet = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    try {
      const data = await api.get(`/platform/wallets/${id}`);
      setWallet(data.wallet || data);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load wallet");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWallet();
  }, [fetchWallet]);

  const balanceAmount = useMemo(() => {
    if (!wallet) return 0;
    if (typeof wallet.balance === "number" || typeof wallet.balance === "object") return getAmount(wallet.balance);
    return getAmount(wallet.balanceAmount);
  }, [wallet]);

  const balanceCurrency = useMemo(() => {
    if (!wallet) return "NGN";
    return getCurrency(wallet.balance, wallet.currency || "NGN");
  }, [wallet]);

  const totalCredits = useMemo(() => transactions.reduce((sum, txn) => {
    const signed = signedTransactionAmount(txn);
    return signed > 0 ? sum + signed : sum;
  }, 0), [transactions]);

  const totalDebits = useMemo(() => transactions.reduce((sum, txn) => {
    const signed = signedTransactionAmount(txn);
    return signed < 0 ? sum + Math.abs(signed) : sum;
  }, 0), [transactions]);

  const adjustmentAmount = Math.abs(Number(form.amount || 0));
  const previewBalance = modal === "reduce" ? balanceAmount - adjustmentAmount : balanceAmount + adjustmentAmount;

  const openModal = (action) => {
    setModal(action);
    setForm({ amount: "", reason: "" });
    setNotice(null);
  };

  const patchLocalBalance = (nextBalance, type, reason, signedAmount) => {
    setWallet((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (typeof next.balance === "object" && next.balance !== null) {
        next.balance = { ...next.balance, amount: nextBalance, currency: balanceCurrency };
      } else {
        next.balance = nextBalance;
        next.currency = balanceCurrency;
      }
      return next;
    });

    setTransactions((prev) => [
      {
        id: `local-${Date.now()}`,
        type,
        amount: { amount: signedAmount, currency: balanceCurrency },
        description: reason,
        createdAt: new Date().toISOString(),
        pendingRefresh: true,
      },
      ...prev,
    ]);
  };

  const handleSubmit = async () => {
    if (!form.amount || adjustmentAmount <= 0) {
      setNotice({ type: "error", message: "Please enter a valid amount." });
      return;
    }

    if (modal === "reduce" && adjustmentAmount > balanceAmount) {
      setNotice({ type: "error", message: "Reduction is greater than the current balance." });
      return;
    }

    setSubmitting(true);
    setNotice(null);
    const type = modal === "add" ? "CREDIT_ADJUSTMENT" : "DEBIT_ADJUSTMENT";
    const signedAmount = modal === "add" ? adjustmentAmount : -adjustmentAmount;
    const nextBalance = balanceAmount + signedAmount;
    const reason = form.reason || `Balance ${modal === "add" ? "increase" : "decrease"} by platform`;

    try {
      await api.post("/platform/wallet-adjustments", {
        tenantId: wallet.tenantId || id,
        amount: adjustmentAmount,
        type,
        reason,
      });
      patchLocalBalance(nextBalance, type, reason, signedAmount);
      setModal(null);
      setNotice({ type: "success", message: `Balance ${modal === "add" ? "increased" : "reduced"}. Refreshing latest overview...` });
      fetchWallet({ silent: true });
    } catch (err) {
      setNotice({ type: "error", message: err.message || "Failed to adjust balance." });
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

  if (error && !wallet) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-sm">{error}</p>
        <button className="mt-3 px-4 py-2 bg-primary text-white text-sm rounded-lg" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!wallet) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <button onClick={() => router.push("/platform/wallets")} className="text-sm text-gray-500 hover:text-gray-700 mb-2">Back to Wallets</button>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{wallet.tenantName || "Wallet"}</h1>
            <p className="text-sm text-gray-500 mt-1">Balance overview and manual platform adjustments</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchWallet({ silent: true })} disabled={refreshing}>
            {refreshing ? <Loader2 size={14} className="animate-spin mr-1" /> : <RefreshCw size={14} className="mr-1" />}
            Refresh
          </Button>
        </div>
      </div>

      {notice && (
        <div className={`border text-sm rounded-lg px-4 py-3 ${notice.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {notice.message}
        </div>
      )}

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
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Effect</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">No transactions yet</td></tr>
              )}
              {transactions.map((txn) => {
                const signed = signedTransactionAmount(txn);
                const debit = signed < 0;
                const cur = getCurrency(txn.amount, txn.currency || balanceCurrency);
                return (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{txn.type || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${debit ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {debit ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                        {debit ? "Debit" : "Credit"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${debit ? "text-red-600" : "text-green-600"}`}>{debit ? "-" : "+"}{formatCurrency(Math.abs(signed), cur)}</td>
                    <td className="px-4 py-3 text-gray-700">{txn.description || txn.reason || (txn.pendingRefresh ? "Pending refresh" : "-")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !submitting && setModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              {modal === "add" ? <Plus size={18} /> : <Minus size={18} />}
              {modal === "add" ? "Add Balance" : "Reduce Balance"}
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm my-4 space-y-1">
              <div className="flex justify-between gap-3"><span className="text-gray-500">Current balance</span><span className="font-medium">{formatCurrency(balanceAmount, balanceCurrency)}</span></div>
              <div className="flex justify-between gap-3"><span className="text-gray-500">Adjustment</span><span className={modal === "reduce" ? "font-medium text-red-600" : "font-medium text-green-600"}>{modal === "reduce" ? "-" : "+"}{formatCurrency(adjustmentAmount, balanceCurrency)}</span></div>
              <div className="flex justify-between gap-3 border-t border-gray-200 pt-1"><span className="text-gray-500">New balance</span><span className="font-semibold">{formatCurrency(previewBalance, balanceCurrency)}</span></div>
            </div>
            {notice?.type === "error" && <p className="text-sm text-red-600 mb-3">{notice.message}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Amount ({balanceCurrency})</label>
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
              <Button variant="secondary" className="flex-1" disabled={submitting} onClick={() => setModal(null)}>Cancel</Button>
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
