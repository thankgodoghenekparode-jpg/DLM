"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ClipboardList, History, User, Bell, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { label: "Today's Trips", href: "/driver/trips", icon: ClipboardList },
  { label: "History", href: "/driver/history", icon: History },
  { label: "Profile", href: "/driver/profile", icon: User },
  { label: "Notifications", href: "/driver/notifications", icon: Bell },
];

export default function DriverSidebar({ open, onClose, collapsed }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/driver/login");
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-50 h-full bg-surface-dark text-white transform transition-all duration-200 lg:translate-x-0 ${collapsed ? "w-16" : "w-64"} ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className={`flex items-center border-b border-gray-700 ${collapsed ? "justify-center px-0 py-5" : "gap-2 px-6 py-5"}`}>
          <Image src="/logo.svg" alt="DLM" width={32} height={32} className="w-8 h-8 flex-shrink-0" unoptimized />
          {!collapsed && (
            <div className="truncate">
              <p className="font-semibold text-sm">Da Logistics</p>
              <p className="text-xs text-gray-400">Driver Portal</p>
            </div>
          )}
        </div>
        <nav className="py-4 overflow-y-auto h-[calc(100%-73px)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={onClose} className={`flex items-center ${collapsed ? "justify-center px-0 py-3 mx-1" : "gap-3 px-6 py-2.5"} text-sm transition-colors rounded-lg ${collapsed ? "mx-1" : "mx-0"} ${active ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`} title={collapsed ? item.label : undefined}>
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className={`absolute bottom-0 left-0 right-0 border-t border-gray-700 ${collapsed ? "px-0" : "px-2"} py-3`}>
          <button onClick={handleLogout} className={`flex items-center w-full text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"}`} title={collapsed ? "Logout" : undefined}>
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
