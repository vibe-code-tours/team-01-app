"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSession, signOut } from "@/lib/api-client";
import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const result = await fetchSession();
      if (!result.success || !result.data) {
        router.push("/login");
        return;
      }

      const sessionData = result.data as { user?: { name: string; email: string; role?: string } };
      const userData = sessionData.user;
      if (!userData || !["super-admin", "admin"].includes(userData.role || "")) {
        router.push("/login");
        return;
      }

      setUser(userData);
      setAuthorized(true);
    }
    checkAuth();
  }, [router]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-base-200/50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen shadow-[2px_0_8px_-4px_rgba(0,0,0,0.06)]">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full shadow-2xl animate-slide-in-right">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-base-100/80 backdrop-blur-md">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                className="btn btn-ghost btn-sm btn-square lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="text-sm font-medium text-base-content/60 lg:hidden">Admin</span>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-base-content/50">{user.role}</div>
                  </div>
                  <div className="avatar placeholder">
                    <div className="bg-primary/10 text-primary rounded-full w-8">
                      <span className="text-xs font-semibold">{user.name?.charAt(0)}</span>
                    </div>
                  </div>
                </>
              )}
              <button onClick={handleSignOut} className="btn btn-ghost btn-sm text-base-content/50 hover:text-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}