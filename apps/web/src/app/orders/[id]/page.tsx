"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { userFetch } from "@/lib/api-client";

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

const statusColors: Record<string, string> = {
  pending: "badge-warning",
  paid: "badge-info",
  approved: "badge-info",
  scheduled: "badge-primary",
  assigned: "badge-secondary",
  delivered: "badge-success",
  cancelled: "badge-error",
  rejected: "badge-error",
};

const statusLabels: Record<string, string> = {
  pending: "Pending Payment",
  paid: "Awaiting Approval",
  approved: "Approved",
  scheduled: "Scheduled",
  assigned: "Assigned",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
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

  useEffect(() => {
    async function load() {
      const result = await userFetch<Order>(`/orders/${id}`);
      if (result.success && result.data) {
        setOrder(result.data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

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
      // Refresh order
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
        <h1 className="text-2xl font-bold">Order not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold">Order Detail</h1>
      </div>

      {message && (
        <div className={`alert ${message.includes("success") || message.includes("uploaded") ? "alert-success" : "alert-error"} mb-6`}>
          <span>{message}</span>
        </div>
      )}

      {/* Order Info */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-base-content/50">Order ID</p>
            <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
          </div>
          <span className={`badge ${statusColors[order.status] || "badge-ghost"}`}>
            {statusLabels[order.status] || order.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-base-content/50">Type</p>
            <p className="font-medium capitalize">{order.orderType}</p>
          </div>
          <div>
            <p className="text-base-content/50">Date</p>
            <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">
          {order.orderType === "subscription" ? "Subscription Package" : "Items"}
        </h2>
        <div className="space-y-3">
          {order.orderType === "subscription" && order.paymentDetails ? (
            (() => {
              try {
                const details = JSON.parse(order.paymentDetails);
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
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
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-base-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.productImage ? (
                    <img src={getImageSrc(item.productImage)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.productName || "Product"}</p>
                  <p className="text-xs text-base-content/50">x{item.quantity}</p>
                </div>
                <span className="font-medium text-sm">{formatPrice(item.subtotal)} MMK</span>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-base-200 mt-4 pt-4 flex justify-between font-bold">
          <span>Total</span>
          <span className="text-primary">{formatPrice(order.totalAmount)} MMK</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* Upload Payment Proof — only when pending and no proof yet */}
        {order.status === "pending" && !order.paymentProofUrl && (
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6">
            <h2 className="font-semibold mb-3">Upload Payment Proof</h2>
            <p className="text-sm text-base-content/50 mb-3">Upload a screenshot of your bank transfer or payment.</p>
            <input
              type="file"
              className="file-input file-input-bordered w-full"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUploadProof}
              disabled={uploading}
            />
          </div>
        )}

        {/* Payment Proof uploaded — show image + confirm button */}
        {order.paymentProofUrl && (
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6">
            <h2 className="font-semibold mb-3">Payment Proof</h2>
            <img src={getImageSrc(order.paymentProofUrl)} alt="Payment proof" className="max-w-xs rounded-lg mb-4" />
            {order.status === "pending" && (
              <button
                className={`btn btn-primary w-full ${confirming ? "loading" : ""}`}
                onClick={handleConfirmPayment}
                disabled={confirming}
              >
                {confirming ? "Confirming..." : "Confirm Payment"}
              </button>
            )}
          </div>
        )}

        {/* Waiting for admin approval (paid status) */}
        {order.status === "paid" && (
          <div className="bg-base-200/50 rounded-xl p-4 text-center text-base-content/50 text-sm">
            Waiting for admin to approve your payment...
          </div>
        )}

        {/* Cancel — only pending orders */}
        {order.status === "pending" && (
          <button
            className={`btn btn-outline btn-error w-full ${cancelling ? "loading" : ""}`}
            onClick={handleCancel}
            disabled={cancelling}
          >
            Cancel Order
          </button>
        )}

        {/* Back to Dashboard — when no other actions available */}
        {!["pending", "paid"].includes(order.status) && (
          <a href="/dashboard" className="btn btn-outline w-full">
            Back to Dashboard
          </a>
        )}
      </div>
    </div>
  );
}
