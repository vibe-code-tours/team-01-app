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

const statusColors: Record<string, string> = {
  pending: "badge-warning",
  assigned: "badge-info",
  delivered: "badge-success",
  cancelled: "badge-error",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

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
        <h1 className="text-2xl font-bold">Delivery not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold">Delivery Detail</h1>
      </div>

      {message && (
        <div className={`alert ${message.includes("success") || message.includes("returned") ? "alert-success" : "alert-error"} mb-6`}>
          <span>{message}</span>
        </div>
      )}

      {/* Delivery Info */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-base-content/50">Delivery ID</p>
            <p className="font-mono text-sm">{delivery.id.slice(0, 8)}...</p>
          </div>
          <span className={`badge ${statusColors[delivery.status] || "badge-ghost"}`}>
            {statusLabels[delivery.status] || delivery.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-base-content/50">Bottles</p>
            <p className="font-medium">{delivery.bottleCount} x 20L</p>
          </div>
          <div>
            <p className="text-base-content/50">Coupons Used</p>
            <p className="font-medium">{delivery.bottleCount} coupon{delivery.bottleCount > 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-base-content/50">Scheduled Date</p>
            <p className="font-medium">{delivery.scheduleDate}</p>
          </div>
          <div>
            <p className="text-base-content/50">Time Slot</p>
            <p className="font-medium">{delivery.scheduleTimeStart} — {delivery.scheduleTimeEnd}</p>
          </div>
        </div>
      </div>

      {/* Delivery Details */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Delivery Information</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-base-content/50">Address</p>
            <p className="font-medium">{delivery.deliveryAddress}</p>
          </div>
          <div>
            <p className="text-base-content/50">Township</p>
            <p className="font-medium">{delivery.townshipName || "—"}</p>
          </div>
          <div>
            <p className="text-base-content/50">Contact Phone</p>
            <p className="font-medium">{delivery.contactPhone}</p>
          </div>
          {delivery.notes && (
            <div>
              <p className="text-base-content/50">Notes</p>
              <p className="font-medium">{delivery.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {delivery.status === "pending" && (
          <button
            className={`btn btn-outline btn-error w-full ${cancelling ? "loading" : ""}`}
            onClick={handleCancel}
            disabled={cancelling}
          >
            Cancel Delivery
          </button>
        )}

        {delivery.status !== "pending" && (
          <a href="/dashboard" className="btn btn-outline w-full">
            Back to Dashboard
          </a>
        )}
      </div>
    </div>
  );
}
