"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Socket } from "socket.io-client";
import { adminFetch } from "@/lib/api-client";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getSocket, onSocketReady } from "@/lib/socket";

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: string;
  activeSubscriptions: number;
  recentOrders: {
    id: string;
    orderType: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    userName: string | null;
  }[];
}

const orderTypeLabels: Record<string, string> = {
  retail: "Retail",
  subscription: "Subscription",
  "coupon-delivery": "Coupon",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await adminFetch<Stats>("/stats");
      if (result.success && result.data) {
        setStats(result.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const refreshStats = useCallback(async () => {
    const result = await adminFetch<Stats>("/stats");
    if (result.success && result.data) {
      setStats(result.data);
    }
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let mounted = true;
    let attached = false;

    function attach(socket: Socket) {
      if (attached) return;
      attached = true;
      socket.on("order:new", refreshStats);
      socket.on("order:status-changed", refreshStats);
      socket.on("delivery:new", refreshStats);
      socket.on("delivery:status-changed", refreshStats);
      cleanup = () => {
        socket.off("order:new", refreshStats);
        socket.off("order:status-changed", refreshStats);
        socket.off("delivery:new", refreshStats);
        socket.off("delivery:status-changed", refreshStats);
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
  }, [refreshStats]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">Failed to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your water delivery business</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <div className="animate-fade-in-up">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            color="blue"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
          />
        </div>
        <div className="animate-fade-in-up">
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            color="emerald"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            }
          />
        </div>
        <div className="animate-fade-in-up">
          <StatCard
            title="Total Revenue"
            value={`${Number(stats.totalRevenue).toLocaleString()} MMK`}
            color="amber"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            }
          />
        </div>
        <div className="animate-fade-in-up">
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions}
            color="violet"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            }
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 stagger">
        {[
          { href: "/admin/orders", label: "Orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
          { href: "/admin/users", label: "Users", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
          { href: "/admin/products", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
          { href: "/admin/schedules", label: "Schedules", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 animate-fade-in-up"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={action.icon} />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between p-5 pb-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest customer orders</p>
          </div>
          <Link href="/admin/orders" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Order</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="w-10 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-primary hover:underline font-medium"
                      >
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-700">{order.userName || "Unknown"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        {orderTypeLabels[order.orderType] || order.orderType}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {Number(order.totalAmount).toLocaleString()} <span className="text-xs font-normal text-gray-400">MMK</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={order.status} variant="order" />
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-gray-300 hover:text-primary transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
