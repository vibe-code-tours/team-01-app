"use client";

import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/api-client";

interface AssignedOrder {
  id: string;
  userId: string;
  orderType: string;
  totalAmount: string;
  bottleCount: number | null;
  status: string;
  createdAt: string;
  assignedAt: string | null;
  userName: string | null;
  userPhone: string | null;
  deliveryAddress: string | null;
  contactPhone: string | null;
  townshipName: string | null;
  scheduleDate: string | null;
  scheduleTimeStart: string | null;
  scheduleTimeEnd: string | null;
}

// Hardcoded for demo - in production this would come from auth context
const DEMO_DELIVERY_PERSON_ID = "";

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!DEMO_DELIVERY_PERSON_ID) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    const result = await adminFetch<AssignedOrder[]>(`/assigned/${DEMO_DELIVERY_PERSON_ID}?${params}`);
    if (result.success && result.data) {
      setOrders(result.data);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleDeliver(orderId: string) {
    setDelivering(orderId);
    setMessage("");

    const result = await adminFetch(`/orders/${orderId}/deliver`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    setDelivering(null);
    if (result.success) {
      setMessage("Order marked as delivered");
      setMessageSuccess(true);
      loadOrders();
    } else {
      setMessage(result.error || "Failed to update order");
      setMessageSuccess(false);
    }
  }

  const assignedCount = orders.filter((o) => o.status === "assigned").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage your assigned deliveries</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <span className="text-xs text-gray-400">Assigned</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{assignedCount}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <span className="text-xs text-gray-400">Delivered</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{deliveredCount}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex gap-2">
            {["", "assigned", "delivered"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === s
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-4 ${messageSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : !DEMO_DELIVERY_PERSON_ID ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-500">Please log in as a delivery person to view assignments.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-400">No deliveries found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-xs text-primary font-medium">#{order.id.slice(0, 8)}</span>
                    <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-md ${
                      order.status === "assigned" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  {order.scheduleDate && (
                    <span className="text-xs text-gray-400">
                      {order.scheduleDate}{order.scheduleTimeStart ? ` ${order.scheduleTimeStart}` : ""}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <span className="text-xs text-gray-400 block">Customer</span>
                    <span className="text-gray-700">{order.userName || "Unknown"}</span>
                    {order.contactPhone && (
                      <span className="text-gray-500 block text-xs">{order.contactPhone}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Township</span>
                    <span className="text-gray-700">{order.townshipName || "-"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-400 block">Address</span>
                    <span className="text-gray-700">{order.deliveryAddress || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Bottles</span>
                    <span className="text-gray-700 font-semibold">{order.bottleCount || 0} x 20L</span>
                  </div>
                </div>

                {order.status === "assigned" && (
                  <button
                    onClick={() => handleDeliver(order.id)}
                    disabled={delivering === order.id}
                    className="w-full py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
                  >
                    {delivering === order.id ? "Marking..." : "Mark as Delivered"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
