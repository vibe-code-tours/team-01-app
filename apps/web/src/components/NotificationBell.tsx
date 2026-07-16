"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useNotifications } from "@/lib/notification-context";

interface NotificationBellProps {
  scrolled?: boolean;
}

function getNotificationIcon(type: string) {
  if (type.includes("order_created") || type.includes("order:new"))
    return "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2";
  if (type.includes("status_changed") || type.includes("status-changed"))
    return "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15";
  if (type.includes("delivery"))
    return "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4";
  if (type.includes("subscription"))
    return "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  return "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell({ scrolled }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className={`btn btn-ghost btn-sm relative ${scrolled ? "text-white hover:bg-white/10" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold leading-none px-1 z-10 ${scrolled ? "bg-white text-black" : "bg-black text-white"}`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 animate-fade-in overflow-hidden border"
          style={{
            backgroundColor: "hsl(210, 100%, 98%)",
            borderColor: "hsl(210, 100%, 93%)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{
              backgroundColor: "hsl(210, 100%, 93%)",
              borderColor: "hsl(210, 100%, 88%)",
            }}
          >
            <h3
              className="font-semibold text-sm"
              style={{ color: "hsl(215, 25%, 15%)" }}
            >
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                className="text-xs font-medium hover:underline"
                style={{ color: "hsl(205, 70%, 35%)" }}
                onClick={() => markAllAsRead()}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div
                className="py-8 text-center text-sm"
                style={{ color: "hsl(215, 25%, 50%)" }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <Link
                  key={n.id}
                  href={(n.link && n.link.startsWith("/")) ? n.link : "#"}
                  className="block w-full text-left px-4 py-3 transition-colors border-b"
                  style={
                    !n.read
                      ? {
                          backgroundColor: "hsl(205, 70%, 93%)",
                          borderLeft: "4px solid hsl(205, 70%, 35%)",
                          borderBottomColor: "hsl(210, 100%, 93%)",
                        }
                      : {
                          backgroundColor: "hsl(210, 100%, 98%)",
                          borderBottomColor: "hsl(210, 100%, 93%)",
                        }
                  }
                  onClick={() => {
                    if (!n.read) {
                      markAsRead(n.id);
                    }
                    setOpen(false);
                  }}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: !n.read
                          ? "hsl(205, 70%, 85%)"
                          : "hsl(210, 100%, 93%)",
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        style={{
                          color: !n.read
                            ? "hsl(205, 70%, 35%)"
                            : "hsl(215, 25%, 55%)",
                        }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={getNotificationIcon(n.type)}
                        />
                      </svg>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm truncate"
                          style={{
                            fontWeight: !n.read ? 600 : 400,
                            color: !n.read
                              ? "hsl(215, 25%, 15%)"
                              : "hsl(215, 25%, 40%)",
                          }}
                        >
                          {n.title}
                        </span>
                        {!n.read && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "hsl(205, 70%, 35%)" }}
                          />
                        )}
                      </div>
                      <p
                        className="text-xs mt-0.5 line-clamp-2"
                        style={{
                          color: !n.read
                            ? "hsl(215, 25%, 30%)"
                            : "hsl(215, 25%, 55%)",
                        }}
                      >
                        {n.message}
                      </p>
                      <span
                        className="text-[10px] mt-1 block"
                        style={{
                          color: !n.read
                            ? "hsl(215, 25%, 50%)"
                            : "hsl(215, 25%, 65%)",
                        }}
                      >
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <Link
              href="/dashboard?tab=notifications"
              className="block text-center py-2.5 text-xs font-medium border-t"
              style={{
                color: "hsl(205, 70%, 35%)",
                backgroundColor: "hsl(210, 100%, 98%)",
                borderColor: "hsl(210, 100%, 93%)",
              }}
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
