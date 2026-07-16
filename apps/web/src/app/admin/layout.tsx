"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { fetchSession, signOut } from "@/lib/api-client";
import { Sidebar } from "@/components/admin/Sidebar";
import { NotificationProvider, useNotifications } from "@/lib/notification-context";
import { NotificationBell } from "@/components/NotificationBell";
import { getSocket, onSocketReady, connectSocket } from "@/lib/socket";

function AdminSocketListener() {
  const { addToast } = useNotifications();

  const handleNewOrder = useCallback((data: { orderId: string; type?: string }) => {
    addToast({
      title: "New Order",
      message: `New ${data.type === "subscription" ? "subscription " : ""}order #${data.orderId.slice(0, 8)} received`,
      type: "order_created",
      link: `/admin/orders/${data.orderId}`,
    });
  }, [addToast]);

  const handleStatusChanged = useCallback((data: { orderId: string; status: string }) => {
    addToast({
      title: "Order Updated",
      message: `Order #${data.orderId.slice(0, 8)} status changed to ${data.status}`,
      type: "order_status_changed",
      link: `/admin/orders/${data.orderId}`,
    });
  }, [addToast]);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let mounted = true;
    let attached = false;

    function attach(socket: Socket) {
      if (attached) return;
      attached = true;
      socket.on("order:new", handleNewOrder);
      socket.on("order:status-changed", handleStatusChanged);
      socket.on("delivery:new", handleNewOrder);
      socket.on("delivery:status-changed", handleStatusChanged);
      cleanup = () => {
        socket.off("order:new", handleNewOrder);
        socket.off("order:status-changed", handleStatusChanged);
        socket.off("delivery:new", handleNewOrder);
        socket.off("delivery:status-changed", handleStatusChanged);
      };
    }

    const socket = getSocket();
    if (socket) {
      attach(socket);
    } else {
      const unsubscribe = onSocketReady(() => {
        if (!mounted) return;
        const s = getSocket();
        if (s) attach(s);
      });
      cleanup = () => { unsubscribe(); };
    }

    return () => { mounted = false; cleanup?.(); };
  }, [handleNewOrder, handleStatusChanged]);

  return null;
}

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

      setUser({ name: userData.name, email: userData.email, role: userData.role || "" });
      setAuthorized(true);

      // Ensure socket is connected for real-time updates
      connectSocket();
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
    <NotificationProvider>
      <AdminSocketListener />
      <div className="flex min-h-screen bg-[#F1F5F9]">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10 h-full shadow-2xl animate-slide-in-right">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between h-14 px-4 lg:px-6">
              <div className="flex items-center gap-2">
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-500 lg:hidden">Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                {user && (
                  <>
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.role}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <span className="text-xs font-semibold">{user.name?.charAt(0)}</span>
                    </div>
                  </>
                )}
                <button onClick={handleSignOut} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" aria-label="Sign out">
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
    </NotificationProvider>
  );
}