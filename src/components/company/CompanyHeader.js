"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Menu, PanelLeftClose, Wallet } from "lucide-react";
import { api } from "@/lib/api";

export default function CompanyHeader({ onMenuClick, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const { selectedBranch, setSelectedBranch, branches } = useBranch();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchHeaderData = useCallback(async () => {
    try {
      const [notifs, wallet] = await Promise.all([
        api.get("/notifications").catch(() => []),
        api.get("/wallet").catch(() => null),
      ]);
      setUnreadCount(Array.isArray(notifs) ? notifs.filter((n) => !n.readAt).length : 0);
      setWalletBalance(wallet?.balance?.amount || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHeaderData();
    const interval = setInterval(fetchHeaderData, 60000);
    return () => clearInterval(interval);
  }, [fetchHeaderData]);

  const handleLogout = () => {
    logout();
    router.push("/company/login");
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button className="hidden lg:flex text-gray-500 hover:text-gray-700" onClick={onToggleCollapse} title="Toggle sidebar">
          <PanelLeftClose size={20} />
        </button>
        <button className="lg:hidden text-gray-600" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-4">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white max-w-[140px] sm:max-w-none"
          >
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/company/wallet" className="relative text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-medium">
          <Wallet size={18} />
          <span className="hidden sm:inline">₦{walletBalance.toLocaleString()}</span>
        </Link>
        <Link href="/company/notifications" className="relative text-gray-500 hover:text-gray-700">
          <Bell size={18} />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full px-1">{unreadCount}</span>}
        </Link>
        <Link href="/company/profile" className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-bg rounded-full flex items-center justify-center">
            <span className="text-primary font-medium text-xs" suppressHydrationWarning>{user?.fullName?.[0] || "U"}</span>
          </div>
          <span className="hidden sm:block text-gray-700 max-w-[120px] truncate" suppressHydrationWarning>{user?.fullName || "User"}</span>
        </Link>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 hidden sm:block">Logout</button>
      </div>
    </header>
  );
}
