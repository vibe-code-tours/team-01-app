"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/api-client";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";

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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-base-content/50">Failed to load dashboard</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-gray-400 py-8 text-center">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="table">
                <thead>
                  <tr className="text-xs uppercase text-gray-400 border-b border-gray-100">
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-sm text-blue-600 hover:underline"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="text-sm text-gray-700">{order.userName || "Unknown"}</td>
                      <td>
                        <StatusBadge value={order.orderType} variant="generic" />
                      </td>
                      <td className="text-sm font-medium text-gray-900">{Number(order.totalAmount).toLocaleString()} MMK</td>
                      <td>
                        <StatusBadge value={order.status} variant="order" />
                      </td>
                      <td className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
