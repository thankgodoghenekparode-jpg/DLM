"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Truck, User, Ticket, MapPin, BarChart3, Wallet, Users, Building2, FileEdit, Bell, Settings, Store, ChevronDown, BriefcaseBusiness, ShieldCheck, Container } from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Main",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { label: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
    ],
  },
  {
    label: "Operations",
    icon: BriefcaseBusiness,
    items: [
      { label: "Carriage", href: "/company/carriage", icon: Container, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
      { label: "Vehicles", href: "/company/fleet", icon: Truck, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "BRANCH_ADMIN"] },
      { label: "Drivers", href: "/company/drivers", icon: User, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
      { label: "Tickets", href: "/company/tickets", icon: Ticket, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
      { label: "Tracker", href: "/company/tracker", icon: MapPin, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    items: [
      { label: "Wallet", href: "/company/wallet", icon: Wallet, roles: ["COMPANY_ADMIN"] },
      { label: "Reports", href: "/company/reports", icon: BarChart3, roles: ["COMPANY_ADMIN", "FLEET_MANAGER"] },
    ],
  },
  {
    label: "Administration",
    icon: ShieldCheck,
    items: [
      { label: "Branches", href: "/company/branches", icon: Store, roles: ["COMPANY_ADMIN"] },
      { label: "Users", href: "/company/users", icon: Users, roles: ["COMPANY_ADMIN"] },
      { label: "Profile", href: "/company/profile", icon: Building2, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
      { label: "Change Requests", href: "/company/change-requests", icon: FileEdit, roles: ["COMPANY_ADMIN"] },
      { label: "Notifications", href: "/company/notifications", icon: Bell, roles: ["COMPANY_ADMIN", "FLEET_MANAGER", "DISPATCH_MANAGER", "BRANCH_ADMIN"] },
      { label: "Settings", href: "/company/settings", icon: Settings, roles: ["COMPANY_ADMIN"] },
    ],
  },
];

export default function CompanySidebar({ open, onClose, collapsed, onToggleCollapse }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openGroups, setOpenGroups] = useState({});
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(user?.role)),
  })).filter((group) => group.items.length > 0);

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItem = (item, nested = false) => {
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={`flex items-center ${collapsed ? "justify-center px-0 py-3 mx-1" : nested ? "gap-3 pl-11 pr-4 py-2" : "gap-3 px-6 py-2.5"} text-sm transition-colors rounded-lg ${active ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={collapsed ? 20 : nested ? 16 : 20} className="flex-shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
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
              <p className="text-xs text-gray-400">Company Portal</p>
            </div>
          )}
        </div>
        <nav className="py-4 overflow-y-auto h-[calc(100%-73px)] space-y-1">
          {visibleGroups.map((group) => {
            const GroupIcon = group.icon;
            const activeGroup = group.items.some((item) => pathname === item.href || pathname.startsWith(item.href + "/"));
            const expanded = group.defaultOpen || activeGroup || openGroups[group.label];

            if (collapsed) {
              return group.items.map((item) => renderNavItem(item));
            }

            return (
              <div key={group.label} className="px-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${activeGroup ? "text-white bg-gray-800" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <GroupIcon size={18} className="flex-shrink-0" />
                    <span className="truncate font-medium">{group.label}</span>
                  </span>
                  <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && (
                  <div className="mt-1 space-y-1">
                    {group.items.map((item) => renderNavItem(item, true))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
