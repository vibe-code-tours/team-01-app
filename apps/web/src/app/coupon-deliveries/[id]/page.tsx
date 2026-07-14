"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userFetch } from "@/lib/api-client";

interface CouponDelivery {
  id: string;
  bottleCount: number;
  status: string;
  deliveryAddress: string;
  contactPhone: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  scheduleDate: string;
  scheduleTimeStart: string;
  scheduleTimeEnd: string;
  townshipName: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string; description: string }> = {
  pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-400",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    label: "Pending",
    description: "Waiting for a delivery person to be assigned.",
  },
  assigned: {
    bg: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-400",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    label: "Assigned",
    description: "A delivery person has been assigned to your order.",
  },
  delivered: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    label: "Delivered",
    description: "Your water has been delivered successfully.",
  },
  cancelled: {
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-400",
    icon: "M6 18L18 6M6 6l12 12",
    label: "Cancelled",
    description: "This delivery has been cancelled.",
  },
};

function formatDateFull(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function CouponDeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [delivery, setDelivery] = useState<CouponDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const result = await userFetch<CouponDelivery>(`/coupon-deliveries/${id}`);
      if (result.success && result.data) {
        setDelivery(result.data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleCancel() {
    if (!confirm("Cancel this delivery? Your coupons will be returned.")) return;
    setCancelling(true);
    const result = await userFetch(`/coupon-deliveries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    setCancelling(false);
    if (result.success) {
      setMessage("Delivery cancelled. Coupons returned.");
      const refreshed = await userFetch<CouponDelivery>(`/coupon-deliveries/${id}`);
      if (refreshed.success && refreshed.data) setDelivery(refreshed.data);
    } else {
      setMessage(result.error || "Failed to cancel");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-1">Delivery not found</h1>
        <p className="text-sm text-base-content/50 mb-4">This delivery doesn&apos;t exist or has been removed.</p>
        <button className="btn btn-primary btn-sm" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const status = statusConfig[delivery.status] || statusConfig.pending;

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
          <h1 className="text-xl font-bold text-base-content">Delivery Detail</h1>
          <p className="text-xs text-base-content/50 font-mono">{delivery.id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Toast message */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
          message.includes("success") || message.includes("returned")
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

      {/* Schedule Card */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 mb-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-base-content">Schedule</h3>
        </div>
        <div className="bg-base-200/50 rounded-xl p-4">
          <p className="font-semibold text-base-content">{formatDateFull(delivery.scheduleDate)}</p>
          <p className="text-sm text-primary font-medium mt-1">{delivery.scheduleTimeStart} — {delivery.scheduleTimeEnd}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 mb-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-sm font-semibold text-base-content">Order Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-base-200/50 rounded-xl p-3">
            <p className="text-xs text-base-content/50 mb-0.5">Bottles</p>
            <p className="font-semibold text-base-content">{delivery.bottleCount} x 20L</p>
          </div>
          <div className="bg-base-200/50 rounded-xl p-3">
            <p className="text-xs text-base-content/50 mb-0.5">Coupons Used</p>
            <p className="font-semibold text-base-content">{delivery.bottleCount}</p>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-base-100 border border-base-200 rounded-2xl p-5 mb-4 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-sm font-semibold text-base-content">Delivery Address</h3>
        </div>
        <div className="space-y-3">
          <div className="bg-base-200/50 rounded-xl p-3">
            <p className="text-sm text-base-content">{delivery.deliveryAddress}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-base-200/50 rounded-xl p-3">
              <p className="text-xs text-base-content/50 mb-0.5">Township</p>
              <p className="text-sm font-medium">{delivery.townshipName || "—"}</p>
            </div>
            <div className="bg-base-200/50 rounded-xl p-3">
              <p className="text-xs text-base-content/50 mb-0.5">Phone</p>
              <p className="text-sm font-medium">{delivery.contactPhone}</p>
            </div>
          </div>
          {delivery.notes && (
            <div className="bg-base-200/50 rounded-xl p-3">
              <p className="text-xs text-base-content/50 mb-0.5">Notes</p>
              <p className="text-sm font-medium">{delivery.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 mt-6 animate-fade-in-up">
        {delivery.status === "pending" && (
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
            Cancel Delivery
          </button>
        )}

        {delivery.status !== "pending" && (
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
