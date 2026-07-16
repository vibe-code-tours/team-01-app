"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  getAllowedTransitions,
  getActionConfig,
  getProgressSteps,
  getProgressIndex,
  isTerminalStatus,
} from "@/lib/order-status";

interface OrderItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  productName: string;
}

interface ScheduleInfo {
  scheduleId: string;
  townshipId: string;
  deliveryAddress: string;
  contactPhone: string;
  notes: string | null;
  scheduleDate: string | null;
  scheduleTimeStart: string | null;
  scheduleTimeEnd: string | null;
  townshipName: string | null;
}

interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
}

interface OrderDetail {
  id: string;
  userId: string;
  orderType: string;
  status: string;
  totalAmount: string;
  bottleCount: number | null;
  deliveryAddress: string | null;
  scheduledDate: string | null;
  adminNotes: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  items: OrderItem[];
  scheduleInfo: ScheduleInfo | null;
}

const orderTypeLabels: Record<string, string> = {
  retail: "Retail",
  subscription: "Subscription",
  "coupon-delivery": "Coupon Delivery",
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [selectedDP, setSelectedDP] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);

  // Confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState("");
  const [confirmReason, setConfirmReason] = useState("");

  const isCouponDelivery = order?.orderType === "coupon-delivery";
  const allowed = order ? getAllowedTransitions(order.status, order.orderType) : [];

  const loadOrder = useCallback(async () => {
    const result = await adminFetch<OrderDetail>(`/orders/${id}`);
    if (result.success && result.data) {
      const o = result.data;
      setOrder(o);
      setAdminNotes(o.adminNotes || "");
    }
    setLoading(false);
  }, [id]);

  const loadDeliveryPersons = useCallback(async () => {
    const result = await adminFetch<DeliveryPerson[]>("/delivery-persons");
    if (result.success && result.data) {
      setDeliveryPersons(result.data);
    }
  }, []);

  useEffect(() => {
    loadOrder();
    loadDeliveryPersons();
  }, [loadOrder, loadDeliveryPersons]);

  function handleActionClick(targetStatus: string) {
    const config = getActionConfig(targetStatus);
    if (config.requiresConfirmation) {
      setConfirmAction(targetStatus);
      setConfirmReason("");
      setConfirmOpen(true);
    } else {
      submitStatusChange(targetStatus);
    }
  }

  async function submitStatusChange(newStatus: string, reason?: string) {
    setSaving(true);
    setMessage("");

    const body: Record<string, string> = { status: newStatus };
    if (adminNotes !== (order?.adminNotes || "")) body.adminNotes = adminNotes;
    if (isCouponDelivery && newStatus === "assigned" && selectedDP) {
      body.deliveryPersonId = selectedDP;
    }
    if (reason) body.adminNotes = reason;

    const result = await adminFetch(`/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    setConfirmOpen(false);
    if (result.success) {
      setMessage("Order updated successfully");
      setMessageSuccess(true);
      loadOrder();
    } else {
      setMessage(result.error || "Failed to update order");
      setMessageSuccess(false);
    }
  }

  async function handleNotesSave() {
    setSaving(true);
    setMessage("");
    const result = await adminFetch(`/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes }),
    });
    setSaving(false);
    if (result.success) {
      setMessage("Notes saved");
      setMessageSuccess(true);
      loadOrder();
    } else {
      setMessage(result.error || "Failed to save notes");
      setMessageSuccess(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </div>
        <p className="text-sm text-gray-500">Order not found</p>
      </div>
    );
  }

  const steps = getProgressSteps(order.orderType);
  const progressIdx = getProgressIndex(order.status, order.orderType);
  const terminal = isTerminalStatus(order.status, order.orderType);

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => router.back()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isCouponDelivery ? "Coupon Delivery" : "Order"} Detail</h1>
          <p className="text-sm text-gray-500 mt-0.5 font-mono text-xs">{order.id}</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => {
            const isCompleted = progressIdx >= 0 && i <= progressIdx;
            const isCurrent = i === progressIdx;
            const isFuture = progressIdx >= 0 && i > progressIdx;
            const isCancelled = order.status === "cancelled";
            const isRejected = order.status === "rejected";

            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isCancelled || isRejected
                      ? "bg-red-100 text-red-600"
                      : isCompleted
                        ? "bg-primary text-white"
                        : isFuture
                          ? "bg-gray-100 text-gray-400"
                          : "bg-gray-100 text-gray-400"
                  }`}>
                    {isCompleted && !isCancelled && !isRejected ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium capitalize whitespace-nowrap ${
                    isCurrent ? "text-primary" : isCompleted ? "text-gray-700" : "text-gray-400"
                  }`}>
                    {step}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-18px] rounded ${
                    isCompleted && i < progressIdx ? "bg-primary" : "bg-gray-100"
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>
        {(order.status === "cancelled" || order.status === "rejected") && (
          <div className="mt-3 text-center">
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md capitalize">{order.status}</span>
          </div>
        )}
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Status</span>
            <StatusBadge value={order.status} variant="order" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Type</span>
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">{orderTypeLabels[order.orderType] || order.orderType}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Customer</span>
            <span className="text-sm font-medium text-gray-900">{order.userName || "Unknown"}</span>
            <span className="text-xs text-gray-400 block">{order.userEmail}</span>
          </div>
          {isCouponDelivery ? (
            <>
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Bottles</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{order.bottleCount} x 20L</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block mb-0.5">Coupons Used</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{order.bottleCount}</span>
              </div>
            </>
          ) : (
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Amount</span>
              <span className="text-sm font-semibold text-gray-900 tabular-nums">{Number(order.totalAmount).toLocaleString()} <span className="text-xs font-normal text-gray-400">MMK</span></span>
            </div>
          )}
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Created</span>
            <span className="text-sm text-gray-700">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* Schedule & Delivery info for coupon-delivery */}
      {isCouponDelivery && order.scheduleInfo && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Schedule & Delivery</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Date</span>
              <span className="text-sm text-gray-700">{order.scheduleInfo.scheduleDate || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Time Slot</span>
              <span className="text-sm text-gray-700">{order.scheduleInfo.scheduleTimeStart} - {order.scheduleInfo.scheduleTimeEnd}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Township</span>
              <span className="text-sm text-gray-700">{order.scheduleInfo.townshipName || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Contact Phone</span>
              <span className="text-sm text-gray-700">{order.scheduleInfo.contactPhone}</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-400 block mb-0.5">Address</span>
              <span className="text-sm text-gray-700">{order.scheduleInfo.deliveryAddress}</span>
            </div>
            {order.scheduleInfo.notes && (
              <div className="col-span-2">
                <span className="text-xs text-gray-400 block mb-0.5">Notes</span>
                <span className="text-sm text-gray-700">{order.scheduleInfo.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order items for retail/subscription */}
      {!isCouponDelivery && order.items.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2">Product</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2">Qty</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2">Unit Price</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-50">
                    <td className="px-4 py-2.5 text-sm text-gray-700">{item.productName}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right tabular-nums">{Number(item.quantity)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right tabular-nums">{Number(item.unitPrice).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 text-right tabular-nums">{Number(item.subtotal).toLocaleString()} <span className="text-xs font-normal text-gray-400">MMK</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Actions</h2>
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-4 ${messageSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        {terminal ? (
          <p className="text-sm text-gray-500 mb-4">This order has reached a final status and cannot be changed.</p>
        ) : (
          <>
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {allowed.map((targetStatus) => {
                const config = getActionConfig(targetStatus);
                return (
                  <button
                    key={targetStatus}
                    onClick={() => handleActionClick(targetStatus)}
                    disabled={saving}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${config.color}`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>

            {/* Delivery person select for coupon-delivery assign */}
            {isCouponDelivery && allowed.includes("assigned") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Person</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={selectedDP} onChange={(e) => setSelectedDP(e.target.value)}>
                  <option value="">Select delivery person</option>
                  {deliveryPersons.map((dp) => (
                    <option key={dp.id} value={dp.id}>{dp.name} ({dp.phone})</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* Admin notes (always editable) */}
        {!isCouponDelivery && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Notes</label>
            <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes about this order..." />
            <button onClick={handleNotesSave} disabled={saving} className="mt-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all disabled:opacity-50">
              Save Notes
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{getActionConfig(confirmAction).confirmationTitle}</h3>
            <p className="text-sm text-gray-500 mb-4">{getActionConfig(confirmAction).confirmationMessage}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
              <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" rows={2} value={confirmReason} onChange={(e) => setConfirmReason(e.target.value)} placeholder="Enter reason..." />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
                Go Back
              </button>
              <button onClick={() => submitStatusChange(confirmAction, confirmReason || undefined)} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50">
                {saving ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
