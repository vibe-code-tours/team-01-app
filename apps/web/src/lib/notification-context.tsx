"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { userFetch } from "@/lib/api-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ToastContainer } from "@/components/Toast";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const addToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshNotifications = useCallback(async () => {
    const res = await userFetch<{ notifications: Notification[]; unreadCount: number }>("/notifications");
    if (res.success && res.data) {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update — update state immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    // Then sync to server
    await userFetch(`/notifications/${id}/read`, { method: "PATCH" });
  }, []);

  const markAllAsRead = useCallback(async () => {
    await userFetch("/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchSession().then(async (res) => {
      if (!mounted) return;
      if (!res.success) return;

      refreshNotifications();

      const socket = await connectSocket();
      if (!socket || !mounted) return;
      socketRef.current = socket;

      socket.on("notification:new", (notification: Notification) => {
        if (!mounted) return;
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        addToast({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link,
        });
      });

      socket.on("order:new", () => {
        if (!mounted) return;
        refreshNotifications();
      });

      socket.on("order:status-changed", () => {
        if (!mounted) return;
        refreshNotifications();
      });

      socket.on("delivery:new", () => {
        if (!mounted) return;
        refreshNotifications();
      });

      socket.on("delivery:status-changed", () => {
        if (!mounted) return;
        refreshNotifications();
      });
    });

    return () => {
      mounted = false;
      socketRef.current?.off("notification:new");
      socketRef.current?.off("order:new");
      socketRef.current?.off("order:status-changed");
      socketRef.current?.off("delivery:new");
      socketRef.current?.off("delivery:status-changed");
      disconnectSocket();
    };
  }, [refreshNotifications, addToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        addToast,
        removeToast,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </NotificationContext.Provider>
  );
}

async function fetchSession() {
  try {
    const res = await fetch("/api/auth/get-session", { credentials: "include" });
    const text = await res.text();
    if (!text) return { success: false };
    const data = JSON.parse(text);
    return data?.user ? { success: true } : { success: false };
  } catch {
    return { success: false };
  }
}
