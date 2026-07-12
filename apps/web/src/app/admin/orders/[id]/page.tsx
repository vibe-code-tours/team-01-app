"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface OrderItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  productName: string;
}

interface OrderDetail {
  id: string;
  userId: string;
  orderType: string;
  status: string;
  totalAmount: string;
  deliveryAddress: string | null;
  deliveryLatitude: string | null;
  deliveryLongitude: string | null;
  scheduledDate: string | null;
  adminNotes: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  items: OrderItem[];
}

const STATUSES = ["pending", "paid", "approved", "scheduled", "assigned", "delivered", "cancelled"];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadOrder() {
    const result = await adminFetch<OrderDetail>(`/orders/${id}`);
    if (result.success && result.data) {
      const o = result.data;
      setOrder(o);
      setStatus(o.status);
      setAdminNotes(o.adminNotes || "");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const body: Record<string, string> = {};
    if (order && status !== order.status) body.status = status;
    if (adminNotes !== (order?.adminNotes || "")) body.adminNotes = adminNotes;

    const result = await adminFetch(`/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (result.success) {
      setMessage("Order updated successfully");
      loadOrder();
    } else {
      setMessage(result.error || "Failed to update order");
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold">Order Detail</h1>
      </div>

      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title">Order Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">Order ID:</span> <span className="font-mono">{order.id}</span></div>
            <div><span className="font-semibold">Status:</span> <StatusBadge value={order.status} variant="order" /></div>
            <div><span className="font-semibold">Customer:</span> {order.userName || "Unknown"} ({order.userEmail})</div>
            <div><span className="font-semibold">Type:</span> <StatusBadge value={order.orderType} variant="generic" /></div>
            <div><span className="font-semibold">Amount:</span> {Number(order.totalAmount).toLocaleString()} MMK</div>
            <div><span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleDateString()}</div>
            {order.deliveryAddress && (
              <div className="col-span-2"><span className="font-semibold">Address:</span> {order.deliveryAddress}</div>
            )}
            {order.scheduledDate && (
              <div><span className="font-semibold">Scheduled:</span> {new Date(order.scheduledDate).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>

      {order.items.length > 0 && (
        <div className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h2 className="card-title">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productName}</td>
                      <td>{Number(item.quantity)}</td>
                      <td>{Number(item.unitPrice).toLocaleString()} MMK</td>
                      <td>{Number(item.subtotal).toLocaleString()} MMK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Update Order</h2>
          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
              <span>{message}</span>
            </div>
          )}
          <form onSubmit={handleUpdate}>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Status</span></label>
              <select className="select select-bordered w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Admin Notes</span></label>
              <textarea className="textarea textarea-bordered w-full" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
            </div>
            <button type="submit" className={`btn btn-primary ${saving ? "loading" : ""}`} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
