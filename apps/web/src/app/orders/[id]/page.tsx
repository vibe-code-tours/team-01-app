"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { userFetch } from "@/lib/api-client";
import type { Socket } from "socket.io-client";
import { getSocket, onSocketReady, connectSocket } from "@/lib/socket";

interface OrderItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  productName: string | null;
  productImage: string | null;
}

interface Order {
  id: string;
  orderType: string;
  totalAmount: string;
  status: string;
  paymentProofUrl: string | null;
  paymentDetails: string | null;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string; description: string }> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    label: "Pending Payment",
    description: "Upload your payment proof to proceed.",
  },
  paid: {
    bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-400",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    label: "Awaiting Approval",
    description: "Waiting for admin to approve your payment.",
  },
  approved: {
    bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800",
    text: "text-sky-700 dark:text-sky-400",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    label: "Approved",
    description: "Your payment has been approved.",
  },
  scheduled: {
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-400",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    label: "Scheduled",
    description: "Your delivery has been scheduled.",
  },
  assigned: {
    bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-400",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    label: "Out for Delivery",
    description: "A delivery person is on the way.",
  },
  delivered: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    label: "Delivered",
    description: "Your order has been delivered.",
  },
  cancelled: {
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    icon: "M6 18L18 6M6 6l12 12",
    label: "Cancelled",
    description: "This order has been cancelled.",
  },
  rejected: {
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    label: "Rejected",
    description: "Your payment was rejected. Please contact support.",
  },
};

const orderTypeLabels: Record<string, string> = {
  retail: "Retail",
  subscription: "Subscription",
  "coupon-delivery": "Coupon Delivery",
};

function formatPrice(price: string | number) {
  return new Intl.NumberFormat("en-US", { style: "decimal", maximumFractionDigits: 0 }).format(Number(price));
}

function getImageSrc(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("/")) return `/api${url}`;
  return url;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  // Schedule state
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedules, setSchedules] = useState<{ id: string; date: string; time_start: string; time_end: string; spots_left: number }[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const loadOrder = useCallback(async () => {
    const result = await userFetch<Order>(`/orders/${id}`);
    if (result.success && result.data) {
      setOrder(result.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadOrder();
    connectSocket();
  }, [loadOrder]);

  // Real-time status updates via Socket.IO
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let mounted = true;
    let attached = false;

    function attach(socket: Socket) {
      if (attached) return;
      attached = true;
      const onStatusChanged = (data: { orderId: string }) => {
        if (mounted && data.orderId === id) loadOrder();
      };
      socket.on("order:status-changed", onStatusChanged);
      socket.on("delivery:status-changed", onStatusChanged);
      cleanup = () => {
        socket.off("order:status-changed", onStatusChanged);
        socket.off("delivery:status-changed", onStatusChanged);
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
  }, [id, loadOrder]);

  async function handleUploadProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const result = await userFetch(`/orders/${id}/payment-proof`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (result.success) {
      setMessage("Payment proof uploaded!");
      const refreshed = await userFetch<Order>(`/orders/${id}`);
      if (refreshed.success && refreshed.data) setOrder(refreshed.data);
    } else {
      setMessage(result.error || "Upload failed");
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this order?")) return;
    setCancelling(true);
    const result = await userFetch(`/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    setCancelling(false);
    if (result.success) {
      const refreshed = await userFetch<Order>(`/orders/${id}`);
      if (refreshed.success && refreshed.data) setOrder(refreshed.data);
    } else {
      setMessage(result.error || "Failed to cancel");
    }
  }

  async function handleConfirmPayment() {
    if (!confirm("Confirm you have made the payment?")) return;
    setConfirming(true);
    const result = await userFetch(`/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    setConfirming(false);
    if (result.success) {
      setMessage("Payment confirmed! Waiting for admin approval.");
      const refreshed = await userFetch<Order>(`/orders/${id}`);
      if (refreshed.success && refreshed.data) setOrder(refreshed.data);
    } else {
      setMessage(result.error || "Failed to confirm payment");
    }
  }

  const loadSchedules = useCallback(async () => {
    setLoadingSchedules(true);
    const result = await userFetch<{ id: string; date: string; time_start: string; time_end: string; spots_left: number }[]>("/schedules");
    if (result.success && result.data) {
      setSchedules(result.data);
    }
    setLoadingSchedules(false);
  }, []);

  async function handleSchedule() {
    if (!selectedSchedule || !deliveryAddress || !contactPhone) return;
    setScheduling(true);
    setMessage("");

    const result = await userFetch(`/orders/${id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleId: selectedSchedule,
        deliveryAddress,
        contactPhone,
        notes: scheduleNotes || undefined,
      }),
    });

    setScheduling(false);
    if (result.success) {
      setMessage("Delivery scheduled successfully!");
      setShowSchedule(false);
      const refreshed = await userFetch<Order>(`/orders/${id}`);
      if (refreshed.success && refreshed.data) setOrder(refreshed.data);
    } else {
      setMessage(result.error || "Failed to schedule delivery");
    }
  }

  function openSchedule() {
    setShowSchedule(true);
    loadSchedules();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-1">Order not found</h1>
        <p className="text-sm text-base-content/50 mb-4">This order doesn&apos;t exist or has been removed.</p>
        <button className="btn btn-primary btn-sm" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <button
          className="w-9 h-9 rounded-xl bg-base-200/80 hover:bg-base-200 flex items-center justify-center transition-colors cursor-pointer"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-base-content">Order Detail</h1>
          <p className="text-xs text-base-content/50 font-mono">{order.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Toast message */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
          message.includes("success") || message.includes("uploaded") || message.includes("confirmed")
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
        }`}>
          {message}
        </div>
      )}

      {/* Status Banner */}
      <div className={`${status.bg} border rounded-2xl p-5 mb-5 animate-fade-in-up`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${status.text} bg-white/80 dark:bg-black/20 flex items-center justify-center shrink-0`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={status.icon} />
            </svg>
          </div>
          <div>
            <h2 className={`font-semibold ${status.text}`}>{status.label}</h2>
            <p className="text-sm text-base-content/60">{status.description}</p>
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 mb-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-sm font-semibold text-base-content">Order Info</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-base-200/50 rounded-xl p-3">
            <p className="text-xs text-base-content/50 mb-0.5">Type</p>
            <p className="text-sm font-semibold">{orderTypeLabels[order.orderType] || order.orderType}</p>
          </div>
          <div className="bg-base-200/50 rounded-xl p-3">
            <p className="text-xs text-base-content/50 mb-0.5">Date</p>
            <p className="text-sm font-semibold">
              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 mb-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-sm font-semibold text-base-content">
            {order.orderType === "subscription" ? "Subscription Package" : "Items"}
          </h3>
        </div>
        <div className="space-y-2.5">
          {order.orderType === "subscription" && order.paymentDetails ? (
            (() => {
              try {
                const details = JSON.parse(order.paymentDetails);
                return (
                  <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{details.packageName || "Subscription"}</p>
                      <p className="text-xs text-base-content/50">{details.couponCount} coupons</p>
                    </div>
                  </div>
                );
              } catch {
                return null;
              }
            })()
          ) : (
            order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-base-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.productImage ? (
                    <img src={getImageSrc(item.productImage)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.productName || "Product"}</p>
                  <p className="text-xs text-base-content/50">x{item.quantity}</p>
                </div>
                <span className="font-semibold text-sm tabular-nums">{formatPrice(item.subtotal)} <span className="text-xs font-normal text-base-content/50">MMK</span></span>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-base-200 mt-4 pt-4 flex justify-between items-center">
          <span className="font-semibold text-base-content">Total</span>
          <span className="text-lg font-bold text-primary tabular-nums">{formatPrice(order.totalAmount)} <span className="text-sm font-normal text-base-content/50">MMK</span></span>
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4 animate-fade-in-up">
        {/* Upload Payment Proof */}
        {order.status === "pending" && !order.paymentProofUrl && (
          <div className="bg-base-100 border border-base-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-sm font-semibold text-base-content">Upload Payment Proof</h3>
            </div>
            <p className="text-sm text-base-content/50 mb-4">Upload a screenshot of your bank transfer or payment receipt.</p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <div className="flex flex-col items-center">
                {uploading ? (
                  <span className="loading loading-spinner loading-sm mb-2"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-base-content/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
                <span className="text-sm text-base-content/50">{uploading ? "Uploading..." : "Click to upload"}</span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUploadProof}
                disabled={uploading}
              />
            </label>
          </div>
        )}

        {/* Payment Proof uploaded */}
        {order.paymentProofUrl && (
          <div className="bg-base-100 border border-base-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-sm font-semibold text-base-content">Payment Proof</h3>
            </div>
            <div className="rounded-xl overflow-hidden border border-base-200 mb-4">
              <img src={getImageSrc(order.paymentProofUrl)} alt="Payment proof" className="w-full max-h-64 object-contain bg-base-200/30" />
            </div>
            {order.status === "pending" && (
              <button
                className="btn btn-primary w-full"
                onClick={handleConfirmPayment}
                disabled={confirming}
              >
                {confirming ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {confirming ? "Confirming..." : "Confirm Payment"}
              </button>
            )}
          </div>
        )}

        {/* Waiting for approval */}
        {order.status === "paid" && (
          <div key="paid-status" className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center mx-auto mb-2">
              <span className="loading loading-spinner loading-sm text-sky-500"></span>
            </div>
            <p className="text-sm font-medium text-sky-700 dark:text-sky-400">Waiting for admin approval</p>
            <p className="text-xs text-base-content/50 mt-1">We&apos;ll notify you once your payment is verified.</p>
          </div>
        )}

        {/* Schedule Delivery for approved orders */}
        {order.status === "approved" && order.orderType !== "subscription" && (
          <div className="bg-base-100 border border-base-200 rounded-2xl p-5">
            {!showSchedule ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-base-content">Schedule Delivery</h3>
                </div>
                <p className="text-sm text-base-content/50 mb-4">Your order has been approved. Choose a delivery date and time.</p>
                <button className="btn btn-primary w-full" onClick={openSchedule}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Select Delivery Time
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-base-content">Choose Delivery Time</h3>
                  <button className="text-xs text-base-content/50 hover:text-base-content" onClick={() => setShowSchedule(false)}>Cancel</button>
                </div>

                {loadingSchedules ? (
                  <div className="flex justify-center py-6">
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                ) : schedules.length === 0 ? (
                  <p className="text-sm text-base-content/50 text-center py-4">No available time slots. Please try again later.</p>
                ) : (
                  <>
                    {/* Schedule selection */}
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                      {schedules.map((s) => (
                        <label
                          key={s.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedSchedule === s.id
                              ? "border-primary bg-primary/5"
                              : "border-base-200 hover:border-base-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="schedule"
                            value={s.id}
                            checked={selectedSchedule === s.id}
                            onChange={() => setSelectedSchedule(s.id)}
                            className="radio radio-sm radio-primary"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                            <p className="text-xs text-base-content/50">{s.time_start} - {s.time_end}</p>
                          </div>
                          <span className="text-xs text-base-content/40">{s.spots_left} spots</span>
                        </label>
                      ))}
                    </div>

                    {/* Address */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-base-content/70 mb-1">Delivery Address *</label>
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your delivery address"
                      />
                    </div>

                    {/* Phone */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-base-content/70 mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        className="input input-bordered input-sm w-full"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Phone number"
                      />
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-base-content/70 mb-1">Notes (optional)</label>
                      <textarea
                        className="textarea textarea-bordered textarea-sm w-full"
                        rows={2}
                        value={scheduleNotes}
                        onChange={(e) => setScheduleNotes(e.target.value)}
                        placeholder="Delivery instructions..."
                      />
                    </div>

                    <button
                      className="btn btn-primary w-full"
                      onClick={handleSchedule}
                      disabled={scheduling || !selectedSchedule || !deliveryAddress || !contactPhone}
                    >
                      {scheduling ? <span className="loading loading-spinner loading-sm"></span> : null}
                      {scheduling ? "Scheduling..." : "Confirm Schedule"}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Approved - subscription done */}
        {order.status === "approved" && order.orderType === "subscription" && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Subscription Active</p>
            <p className="text-xs text-base-content/50 mt-1">Your coupons have been added. Use them to schedule deliveries anytime.</p>
          </div>
        )}

        {/* Cancel */}
        {order.status === "pending" && (
          <button
            className="btn btn-outline btn-error w-full"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Cancel Order
          </button>
        )}

        {/* Back to Dashboard */}
        {!["pending", "paid"].includes(order.status) && (
          <button className="btn btn-outline w-full" onClick={() => router.push("/dashboard")}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
