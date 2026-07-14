"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface Order {
  id: string;
  orderType: string;
  totalAmount: string;
  bottleCount: number | null;
  status: string;
  createdAt: string;
  userName: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const orderTypeLabels: Record<string, string> = {
  retail: "Retail",
  subscription: "Subscription",
  "coupon-delivery": "Coupon",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);

    const result = await adminFetch<{ orders: Order[]; pagination: PaginationData }>(`/orders?${params}`);
    if (result.success && result.data) {
      setOrders(result.data.orders);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, typeFilter]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer orders</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="assigned">Assigned</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="retail">Retail</option>
            <option value="subscription">Subscription</option>
            <option value="coupon-delivery">Coupon Delivery</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
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
                      {order.orderType === "coupon-delivery" && order.bottleCount && (
                        <span className="text-xs text-gray-400 ml-1">({order.bottleCount}x)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {order.orderType === "coupon-delivery"
                          ? <>{order.bottleCount || 0} <span className="text-xs font-normal text-gray-400">coupons</span></>
                          : <>{Number(order.totalAmount).toLocaleString()} <span className="text-xs font-normal text-gray-400">MMK</span></>
                        }
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={order.status} variant="order" />
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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

      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
