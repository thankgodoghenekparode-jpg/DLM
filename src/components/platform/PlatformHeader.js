"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Menu, PanelLeftClose, LogOut } from "lucide-react";

export default function PlatformHeader({ onMenuClick, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/platform/login");
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
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/platform/profile" className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-medium text-xs" suppressHydrationWarning>{user?.fullName?.[0] || "A"}</span>
          </div>
          <span className="hidden sm:block text-gray-700 max-w-[120px] truncate" suppressHydrationWarning>{user?.fullName || "Admin"}</span>
        </Link>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 hidden sm:flex items-center gap-1">
          <LogOut size={14} /> Logout
        </button>
      </div>
    </header>
  );
}
