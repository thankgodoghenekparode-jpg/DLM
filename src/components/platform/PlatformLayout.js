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
  const [redirecting, setRedirecting] = useState(false);

  const hasPlatformAccess = isAuthenticated && user?.role && (ROLE_PERMISSIONS[user.role] || []).some((p) => p.startsWith("platform:"));
  const hasRequiredPerm = hasPlatformAccess && (ROLE_PERMISSIONS[user.role] || []).includes(getPermissionFromPath(pathname));

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !isLogin) {
      setRedirecting(true);
      router.replace("/platform/login");
    } else if (isAuthenticated && user?.role) {
      const perms = ROLE_PERMISSIONS[user.role] || [];
      if (!perms.some((p) => p.startsWith("platform:"))) {
        setRedirecting(true);
        router.replace("/platform/login");
      } else {
        const required = getPermissionFromPath(pathname);
        if (!perms.includes(required)) {
          setRedirecting(true);
          router.replace("/platform/dashboard");
        }
      }
    }
  }, [loading, isAuthenticated, isLogin, user, router, pathname]);

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={28} />
      </div>
    );
  }

  if (!isAuthenticated && !isLogin) return null;

  if (hasPlatformAccess) return children;

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
