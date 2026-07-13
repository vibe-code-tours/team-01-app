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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <div className="animate-fade-in-up">
          <StatCard title="Total Users" value={stats.totalUsers} />
        </div>
        <div className="animate-fade-in-up">
          <StatCard title="Total Orders" value={stats.totalOrders} />
        </div>
        <div className="animate-fade-in-up">
          <StatCard
            title="Total Revenue"
            value={`${Number(stats.totalRevenue).toLocaleString()} MMK`}
          />
        </div>
        <div className="animate-fade-in-up">
          <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} />
        </div>
      </div>

      <div className="bg-base-100 rounded-2xl shadow-sm">
        <div className="p-6">
          <h2 className="card-title text-lg">Recent Orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-base-content/40 py-8 text-center">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr className="text-xs uppercase text-base-content/40">
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
                    <tr key={order.id} className="hover:bg-base-200/50">
                      <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="text-sm">{order.userName || "Unknown"}</td>
                      <td>
                        <StatusBadge value={order.orderType} variant="generic" />
                      </td>
                      <td className="text-sm font-medium">{Number(order.totalAmount).toLocaleString()} MMK</td>
                      <td>
                        <StatusBadge value={order.status} variant="order" />
                      </td>
                      <td className="text-sm text-base-content/50">
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
