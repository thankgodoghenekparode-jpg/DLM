"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Truck, User, Ticket, MapPin, BarChart3, Wallet, Users, Building2, FileEdit, Bell, Settings, Store, PackagePlus } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
  { label: "Create Parcel", href: "/company/create-parcel", icon: PackagePlus, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
  { label: "Fleet", href: "/company/fleet", icon: Truck, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "BRANCH_ADMIN"] },
  { label: "Drivers", href: "/company/drivers", icon: User, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
  { label: "Tickets", href: "/company/tickets", icon: Ticket, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
  { label: "Tracker", href: "/company/tracker", icon: MapPin, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
  { label: "Reports", href: "/company/reports", icon: BarChart3, roles: ["COMPANY_ADMIN", "FLEET_MANAGER"] },
  { label: "Wallet", href: "/company/wallet", icon: Wallet, roles: ["COMPANY_ADMIN"] },
  { label: "Branches", href: "/company/branches", icon: Store, roles: ["COMPANY_ADMIN"] },
  { label: "Users", href: "/company/users", icon: Users, roles: ["COMPANY_ADMIN"] },
  { label: "Profile", href: "/company/profile", icon: Building2, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
  { label: "Change Requests", href: "/company/change-requests", icon: FileEdit, roles: ["COMPANY_ADMIN"] },
  { label: "Notifications", href: "/company/notifications", icon: Bell, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
  { label: "Settings", href: "/company/settings", icon: Settings, roles: ["COMPANY_ADMIN"] },
];

export default function CompanySidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-50 h-full bg-surface-dark text-white transform transition-all duration-200 lg:translate-x-0 ${collapsed ? "w-16" : "w-64"} ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className={`flex items-center border-b border-gray-700 ${collapsed ? "justify-center px-0 py-5" : "gap-2 px-6 py-5"}`}>
          <Image src="/logo.svg" alt="DLM" width={32} height={32} className="w-8 h-8 flex-shrink-0" unoptimized />
          {!collapsed && (
            <div className="truncate">
              <p className="font-semibold text-sm">Da Logistics</p>
              <p className="text-xs text-gray-400">Company Portal</p>
            </div>
          )}
        </div>
        <nav className="py-4 overflow-y-auto h-[calc(100%-73px)]">
          {visibleItems.map((item) => {
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
      </aside>
    </>
  );
}
