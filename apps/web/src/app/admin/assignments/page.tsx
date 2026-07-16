"use client";

import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/api-client";

interface AssignableOrder {
  id: string;
  userId: string;
  orderType: string;
  totalAmount: string;
  bottleCount: number | null;
  status: string;
  createdAt: string;
  userName: string | null;
  deliveryAddress: string | null;
  contactPhone: string | null;
  townshipName: string | null;
  scheduleDate: string | null;
  scheduleTimeStart: string | null;
  scheduleTimeEnd: string | null;
}

const orderTypeLabels: Record<string, string> = {
  retail: "Retail",
  subscription: "Subscription",
  "coupon-delivery": "Coupon",
};

interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
}

interface Province {
  id: string;
  name: string;
}

interface Township {
  id: string;
  name: string;
}

export default function AssignmentsPage() {
  const [orders, setOrders] = useState<AssignableOrder[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [townships, setTownships] = useState<Township[]>([]);
  const [provinceFilter, setProvinceFilter] = useState("");
  const [townshipFilter, setTownshipFilter] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedDP, setSelectedDP] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (townshipFilter) params.set("townshipId", townshipFilter);
    else if (provinceFilter) params.set("provinceId", provinceFilter);

    const result = await adminFetch<AssignableOrder[]>(`/assignable?${params}`);
    if (result.success && result.data) {
      setOrders(result.data);
    }
    setLoading(false);
  }, [townshipFilter, provinceFilter]);

  const loadDeliveryPersons = useCallback(async () => {
    const result = await adminFetch<DeliveryPerson[]>("/delivery-persons");
    if (result.success && result.data) {
      setDeliveryPersons(result.data);
    }
  }, []);

  const loadProvinces = useCallback(async () => {
    const result = await adminFetch<{ provinces: Province[] }>("/provinces?limit=100&status=active");
    if (result.success && result.data) {
      setProvinces(result.data.provinces);
    }
  }, []);

  const loadTownships = useCallback(async () => {
    if (!provinceFilter) {
      setTownships([]);
      return;
    }
    const result = await adminFetch<{ townships: Township[] }>(`/townships?provinceId=${provinceFilter}&limit=100&status=active`);
    if (result.success && result.data) {
      setTownships(result.data.townships);
    }
  }, [provinceFilter]);

  useEffect(() => {
    loadProvinces();
    loadDeliveryPersons();
  }, [loadProvinces, loadDeliveryPersons]);

  useEffect(() => {
    loadTownships();
    setTownshipFilter("");
  }, [loadTownships]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function handleProvinceChange(value: string) {
    setProvinceFilter(value);
    setTownshipFilter("");
    setSelectedOrders(new Set());
  }

  function handleTownshipChange(value: string) {
    setTownshipFilter(value);
    setSelectedOrders(new Set());
  }

  function toggleOrder(id: string) {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((o) => o.id)));
    }
  }

  async function handleAssign() {
    if (!selectedDP || selectedOrders.size === 0) return;
    setAssigning(true);
    setMessage("");

    const result = await adminFetch<{ assigned: number; deliveryPerson: string }>("/assignments/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderIds: Array.from(selectedOrders),
        deliveryPersonId: selectedDP,
      }),
    });

    setAssigning(false);
    if (result.success && result.data) {
      setMessage(`${result.data.assigned} orders assigned to ${result.data.deliveryPerson}`);
      setMessageSuccess(true);
      setSelectedOrders(new Set());
      setSelectedDP("");
      loadOrders();
    } else {
      setMessage(result.error || "Failed to assign orders");
      setMessageSuccess(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assign Deliveries</h1>
        <p className="text-sm text-gray-500 mt-1">Select orders and assign to a delivery person</p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={provinceFilter}
            onChange={(e) => handleProvinceChange(e.target.value)}
          >
            <option value="">All Provinces</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            value={townshipFilter}
            onChange={(e) => handleTownshipChange(e.target.value)}
            disabled={!provinceFilter}
          >
            <option value="">{provinceFilter ? "All Townships" : "Select province first"}</option>
            {townships.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <div className="flex-1"></div>

          <span className="text-xs text-gray-400">
            {selectedOrders.size} of {orders.length} selected
          </span>

          <select
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={selectedDP}
            onChange={(e) => setSelectedDP(e.target.value)}
          >
            <option value="">Select delivery person</option>
            {deliveryPersons.map((dp) => (
              <option key={dp.id} value={dp.id}>{dp.name} ({dp.phone})</option>
            ))}
          </select>

          <button
            onClick={handleAssign}
            disabled={assigning || selectedOrders.size === 0 || !selectedDP}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? "Assigning..." : `Assign (${selectedOrders.size})`}
          </button>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-4 ${messageSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No orders ready for assignment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="w-10 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={toggleAll}
                      className="checkbox checkbox-sm"
                    />
                  </th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Order</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Address</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Schedule</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Bottles</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-t border-gray-50 transition-colors ${
                      selectedOrders.has(order.id) ? "bg-primary/5" : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrder(order.id)}
                        className="checkbox checkbox-sm"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-primary font-medium">{order.id.slice(0, 8)}</span>
                      <span className="text-xs text-gray-400 ml-2">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        {orderTypeLabels[order.orderType] || order.orderType}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-700">{order.userName || "Unknown"}</span>
                      {order.contactPhone && (
                        <span className="text-xs text-gray-400 block">{order.contactPhone}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-700">{order.deliveryAddress || "-"}</span>
                      {order.townshipName && (
                        <span className="text-xs text-gray-400 block">{order.townshipName}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {order.scheduleDate ? (
                        <span className="text-sm text-gray-700">
                          {order.scheduleDate}
                          {order.scheduleTimeStart && ` ${order.scheduleTimeStart}`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">{order.bottleCount || 0}</span>
                      <span className="text-xs text-gray-400 ml-0.5">x 20L</span>
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
