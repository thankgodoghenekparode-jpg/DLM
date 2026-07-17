"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/shared/Button";
import { api } from "@/lib/api";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, CreditCard } from "lucide-react";

const CREDIT_TYPES = ["CREDIT_FUNDING", "CREDIT_ADJUSTMENT", "CREDIT_REFUND"];

function formatAmount(type, amount) {
  const num = Number(amount);
  const formatted = `₦${Math.abs(num).toLocaleString()}`;
  return CREDIT_TYPES.includes(type) ? formatted : `-${formatted}`;
}

function formatTypeLabel(type) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFund, setShowFund] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundMethod, setFundMethod] = useState("");
  const [funding, setFunding] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    const [walletRes, txRes] = await Promise.all([
      api.get("/wallet").catch(() => null),
      api.get("/wallet/transactions").catch(() => []),
    ]);
    if (!walletRes) {
      setError("Failed to load wallet data");
    } else {
      setWallet(walletRes);
    }
    setTransactions(Array.isArray(txRes) ? txRes : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleFund = async () => {
    if (!fundAmount || Number(fundAmount) < 100 || !fundMethod) return;
    setFunding(true);
    try {
      const res = await api.post("/wallet/fund", {
        amount: Number(fundAmount),
        currency: "NGN",
        paymentMethod: fundMethod,
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err) {
      alert(err.message || "Payment initiation failed");
    } finally {
      setFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your balance and transactions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-12 w-48 bg-gray-200 rounded" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your balance and transactions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button variant="secondary" onClick={fetchData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your balance and transactions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Wallet size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Available Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                ₦{(wallet.balance?.amount || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowFund(true)}>
              <Plus size={16} className="mr-1" /> Fund Wallet
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => {
              const isCredit = CREDIT_TYPES.includes(t.type);
              return (
                <div key={t.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                      {isCredit ? (
                        <ArrowDownRight size={16} className="text-green-600" />
                      ) : (
                        <ArrowUpRight size={16} className="text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatTypeLabel(t.type)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString()} • Ref: {t.reference}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isCredit ? "text-green-600" : "text-red-500"}`}>
                    {formatAmount(t.type, t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showFund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFund(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus size={20} /> Fund Wallet</h3>
            <div className="space-y-3">
              <input
                placeholder="Amount (₦) — min ₦100"
                type="number"
                min={100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
              />
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={fundMethod}
                onChange={(e) => setFundMethod(e.target.value)}
              >
                <option value="">Select payment method</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setShowFund(false)}>Cancel</Button>
                <Button
                  className="flex-1"
                  disabled={!fundAmount || Number(fundAmount) < 100 || !fundMethod || funding}
                  onClick={handleFund}
                >
                  <CreditCard size={16} className="mr-1" /> {funding ? "Processing..." : "Pay Now"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
