"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Socket } from "socket.io-client";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getSocket, onSocketReady } from "@/lib/socket";
import { getAllowedTransitions, getActionConfig } from "@/lib/order-status";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
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
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleQuickAction(orderId: string, targetStatus: string) {
    setActionLoading(orderId);
    const result = await adminFetch(`/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStatus }),
    });
    setActionLoading(null);
    if (result.success) {
      loadOrders();
    }
  }

  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let mounted = true;
    let attached = false;

    function attach(socket: Socket) {
      if (attached) return;
      attached = true;
      socket.on("order:new", loadOrders);
      socket.on("order:status-changed", loadOrders);
      socket.on("delivery:new", loadOrders);
      socket.on("delivery:status-changed", loadOrders);
      cleanup = () => {
        socket.off("order:new", loadOrders);
        socket.off("order:status-changed", loadOrders);
        socket.off("delivery:new", loadOrders);
        socket.off("delivery:status-changed", loadOrders);
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
  }, [loadOrders]);

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
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Action</th>
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
                    <td className="px-5 py-3 text-right">
                      {(() => {
                        const transitions = getAllowedTransitions(order.status, order.orderType);
                        if (transitions.length === 0) return null;
                        // Show the first positive action (not cancelled)
                        const nextAction = transitions.find((s) => s !== "cancelled" && s !== "rejected");
                        if (!nextAction) return null;
                        const config = getActionConfig(nextAction);
                        // "assigned" action redirects to assignments page
                        if (nextAction === "assigned") {
                          return (
                            <Link
                              href="/admin/assignments"
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${config.color}`}
                            >
                              {config.label}
                            </Link>
                          );
                        }
                        return (
                          <button
                            onClick={() => handleQuickAction(order.id, nextAction)}
                            disabled={actionLoading === order.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${config.color}`}
                          >
                            {actionLoading === order.id ? "..." : config.label}
                          </button>
                        );
                      })()}
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
