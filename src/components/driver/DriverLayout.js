"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import DriverSidebar from "./DriverSidebar";
import { Menu, PanelLeftClose, ClipboardList, History, User, Bell, Loader2, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { label: "Today's Trips", href: "/driver/trips", icon: ClipboardList },
  { label: "History", href: "/driver/history", icon: History },
  { label: "Profile", href: "/driver/profile", icon: User },
  { label: "Notifications", href: "/driver/notifications", icon: Bell },
];

const PUBLIC_ROUTES = ["/driver/login", "/driver/forgot-password"];

function AuthGuard({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isPublic) {
      router.replace("/driver/login");
    } else if (isAuthenticated && user?.role && user.role !== "DRIVER") {
      router.replace("/driver/login");
    }
  }, [loading, isAuthenticated, isPublic, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) return null;
  if (isAuthenticated && user?.role && user.role !== "DRIVER") return null;

  return children;
}

function DriverLogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/driver/login");
  };

  return (
    <button onClick={handleLogout} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
      <LogOut size={14} /> Logout
    </button>
  );
}

export default function DriverLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const noSidebar = PUBLIC_ROUTES.includes(pathname);

  return (
    <AuthProvider>
      <AuthGuard>
        {noSidebar ? (
          <div className="min-h-screen bg-gray-50">{children}</div>
        ) : (
          <div className="min-h-screen bg-gray-50">
            <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} />
            <div className={`flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
              <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="hidden lg:flex text-gray-500 hover:text-gray-700" onClick={() => setSidebarCollapsed((c) => !c)} title="Toggle sidebar">
                    <PanelLeftClose size={20} />
                  </button>
                  <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
                  <div className="flex items-center gap-2 lg:hidden">
                    <div className="w-7 h-7 bg-primary rounded flex items-center justify-center text-white font-bold text-xs">D</div>
                    <span className="font-semibold text-sm">DLM Driver</span>
                  </div>
                </div>
                <DriverLogoutButton />
              </header>
              <main className="flex-1 p-4 sm:p-6 lg:p-6 overflow-auto">{children}</main>
              <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-2 py-1">
                <div className="flex justify-around">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link key={item.href} href={item.href} className={`flex flex-col items-center py-2 px-3 text-xs rounded-lg ${active ? "text-primary" : "text-gray-500"}`}>
                        <Icon size={18} />
                        <span className="mt-0.5">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        )}
      </AuthGuard>
    </AuthProvider>
  );
}
