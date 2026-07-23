"use client";

import Link from "next/link";
import { PackagePlus, Wallet, BarChart3, Settings, ArrowRight } from "lucide-react";

const QUICK_ACTIONS = [
  {
    title: "Create Parcel",
    description: "Start a new dispatch and generate a ticket number.",
    href: "/company/tickets/create",
    icon: PackagePlus,
    color: "bg-primary text-white",
    iconWrap: "bg-white/20 text-white",
  },
  {
    title: "Wallet",
    description: "View balance, funding, and transaction history.",
    href: "/company/wallet",
    icon: Wallet,
    color: "bg-emerald-600 text-white",
    iconWrap: "bg-white/20 text-white",
  },
  {
    title: "Reports",
    description: "Open exports, delivery summaries, and billing records.",
    href: "/company/reports",
    icon: BarChart3,
    color: "bg-slate-900 text-white",
    iconWrap: "bg-white/20 text-white",
  },
  {
    title: "Settings",
    description: "Manage company preferences and platform options.",
    href: "/company/settings",
    icon: Settings,
    color: "bg-amber-500 text-white",
    iconWrap: "bg-white/25 text-white",
  },
];

export default function CompanyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Choose what you want to do next.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} min-h-[180px] sm:min-h-[220px] rounded-2xl p-7 sm:p-8 flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${action.iconWrap}`}>
                  <Icon size={34} />
                </div>
                <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
                  <ArrowRight size={24} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">{action.title}</h2>
                <p className="text-base opacity-90 mt-3 max-w-sm">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
