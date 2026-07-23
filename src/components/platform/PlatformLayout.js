"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PlatformSettingsProvider } from "@/lib/platformSettings";
import { ROLE_PERMISSIONS } from "@/lib/constants";
import PlatformSidebar from "./PlatformSidebar";
import PlatformHeader from "./PlatformHeader";
import { Loader2 } from "lucide-react";

function getPermissionFromPath(pathname) {
  const segment = pathname.replace("/platform/", "").split("/")[0];
  return segment ? `platform:${segment}` : "platform:dashboard";
}

function AuthGuard({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/platform/login";
  const permissions = ROLE_PERMISSIONS[user?.role] || [];
  const hasPlatformAccess = isAuthenticated && permissions.some((permission) => permission.startsWith("platform:"));
  const hasRequiredPerm = hasPlatformAccess && permissions.includes(getPermissionFromPath(pathname));
  const shouldRedirect = !loading && (
    (!isAuthenticated && !isLogin) ||
    (isAuthenticated && !hasPlatformAccess) ||
    (isAuthenticated && isLogin) ||
    (hasPlatformAccess && !isLogin && !hasRequiredPerm)
  );

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !isLogin) {
      router.replace("/platform/login");
      return;
    }

    if (isAuthenticated && !hasPlatformAccess) {
      router.replace("/platform/login");
      return;
    }

    if (isAuthenticated && isLogin) {
      router.replace("/platform/dashboard");
      return;
    }

    if (hasPlatformAccess && !hasRequiredPerm) {
      router.replace("/platform/dashboard");
    }
  }, [loading, isAuthenticated, isLogin, hasPlatformAccess, hasRequiredPerm, router]);

  if (loading || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!isAuthenticated && !isLogin) return null;

  if (isLogin || hasPlatformAccess) return children;

  return null;
}

export default function PlatformLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === "/platform/login";

  return (
    <AuthProvider>
      <AuthGuard>
        {isLogin ? (
          <div className="min-h-screen">{children}</div>
        ) : (
          <PlatformSettingsProvider>
            <div className="min-h-screen">
              <PlatformSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((c) => !c)} />
              <div className={`flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
                <PlatformHeader onMenuClick={() => setSidebarOpen(true)} onToggleCollapse={() => setSidebarCollapsed((c) => !c)} />
                <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
              </div>
            </div>
          </PlatformSettingsProvider>
        )}
      </AuthGuard>
    </AuthProvider>
  );
}
