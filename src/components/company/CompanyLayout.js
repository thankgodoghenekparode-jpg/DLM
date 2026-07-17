"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BranchProvider } from "@/context/BranchContext";
import { PlatformSettingsProvider } from "@/lib/platformSettings";
import { ROLE_PERMISSIONS } from "@/lib/constants";
import CompanySidebar from "./CompanySidebar";
import CompanyHeader from "./CompanyHeader";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ["/company/login", "/company/forgot-password", "/company/register", "/company/onboarding"];

function getPermissionFromPath(pathname) {
  const segment = pathname.replace("/company/", "").split("/")[0];
  return segment ? `company:${segment}` : "company:dashboard";
}

function AuthGuard({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isPublic) {
      router.replace("/company/login");
    } else if (isAuthenticated && user?.role) {
      const perms = ROLE_PERMISSIONS[user.role] || [];
      if (!perms.some((p) => p.startsWith("company:"))) {
        router.replace("/company/login");
      } else {
        const required = getPermissionFromPath(pathname);
        if (!perms.includes(required)) router.replace("/company/dashboard");
      }
    }
  }, [loading, isAuthenticated, isPublic, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!isAuthenticated && !isPublic) return null;

  if (isAuthenticated && user?.role) {
    const perms = ROLE_PERMISSIONS[user.role] || [];
    if (!perms.some((p) => p.startsWith("company:"))) return null;
    const required = getPermissionFromPath(pathname);
    if (!perms.includes(required)) return null;
  }

  return children;
}

export default function CompanyLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const noSidebar = PUBLIC_ROUTES.includes(pathname);

  return (
    <AuthProvider>
      <AuthGuard>
        {noSidebar ? (
          <div className="min-h-screen">{children}</div>
        ) : (
          <PlatformSettingsProvider>
            <BranchProvider>
              <div className="min-h-screen">
                <CompanySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((c) => !c)} />
                <div className={`flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
                  <CompanyHeader onMenuClick={() => setSidebarOpen(true)} onToggleCollapse={() => setSidebarCollapsed((c) => !c)} />
                  <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
                </div>
              </div>
            </BranchProvider>
          </PlatformSettingsProvider>
        )}
      </AuthGuard>
    </AuthProvider>
  );
}
