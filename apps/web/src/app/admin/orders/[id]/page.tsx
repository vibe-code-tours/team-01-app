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

const RETAIL_STATUSES = ["pending", "paid", "approved", "rejected", "scheduled", "assigned", "delivered", "cancelled"];
const COUPON_STATUSES = ["pending", "assigned", "delivered", "cancelled"];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [selectedDP, setSelectedDP] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isCouponDelivery = order?.orderType === "coupon-delivery";
  const statuses = isCouponDelivery ? COUPON_STATUSES : RETAIL_STATUSES;

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

  async function loadDeliveryPersons() {
    const result = await adminFetch<DeliveryPerson[]>("/delivery-persons");
    if (result.success && result.data) {
      setDeliveryPersons(result.data);
    }
  }

  useEffect(() => {
    loadOrder();
    loadDeliveryPersons();
  }, [id]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const body: Record<string, string> = {};
    if (order && status !== order.status) body.status = status;
    if (adminNotes !== (order?.adminNotes || "")) body.adminNotes = adminNotes;

    // For coupon-delivery assignment, include deliveryPersonId
    if (isCouponDelivery && status === "assigned" && selectedDP) {
      body.deliveryPersonId = selectedDP;
    }

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
        <h1 className="text-2xl font-bold text-gray-900">
          {isCouponDelivery ? "Coupon Delivery Detail" : "Order Detail"}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="card-body">
          <h2 className="card-title">{isCouponDelivery ? "Delivery Info" : "Order Info"}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">ID:</span> <span className="font-mono">{order.id}</span></div>
            <div><span className="font-semibold">Status:</span> <StatusBadge value={order.status} variant="order" /></div>
            <div><span className="font-semibold">Customer:</span> {order.userName || "Unknown"} ({order.userEmail})</div>
            <div><span className="font-semibold">Type:</span> <StatusBadge value={order.orderType} variant="generic" /></div>
            {isCouponDelivery ? (
              <>
                <div><span className="font-semibold">Bottles:</span> {order.bottleCount} x 20L</div>
                <div><span className="font-semibold">Coupons Used:</span> {order.bottleCount}</div>
              </>
            ) : (
              <div><span className="font-semibold">Amount:</span> {Number(order.totalAmount).toLocaleString()} MMK</div>
            )}
            <div><span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Schedule / Delivery info for coupon-delivery orders */}
      {isCouponDelivery && order.scheduleInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="card-body">
            <h2 className="card-title">Schedule & Delivery</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">Schedule Date:</span> {order.scheduleInfo.scheduleDate || "—"}</div>
              <div><span className="font-semibold">Time Slot:</span> {order.scheduleInfo.scheduleTimeStart} — {order.scheduleInfo.scheduleTimeEnd}</div>
              <div><span className="font-semibold">Township:</span> {order.scheduleInfo.townshipName || "—"}</div>
              <div><span className="font-semibold">Contact Phone:</span> {order.scheduleInfo.contactPhone}</div>
              <div className="col-span-2"><span className="font-semibold">Address:</span> {order.scheduleInfo.deliveryAddress}</div>
              {order.scheduleInfo.notes && (
                <div className="col-span-2"><span className="font-semibold">Notes:</span> {order.scheduleInfo.notes}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order items for retail/subscription orders */}
      {!isCouponDelivery && order.items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="card-body">
          <h2 className="card-title">Update</h2>
          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
              <span>{message}</span>
            </div>
          )}
          <form onSubmit={handleUpdate}>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Status</span></label>
              <select className="select select-bordered w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Delivery person assignment for coupon-delivery */}
            {isCouponDelivery && status === "assigned" && (
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Delivery Person</span></label>
                <select className="select select-bordered w-full" value={selectedDP} onChange={(e) => setSelectedDP(e.target.value)}>
                  <option value="">Select delivery person</option>
                  {deliveryPersons.map((dp) => (
                    <option key={dp.id} value={dp.id}>{dp.name} ({dp.phone})</option>
                  ))}
                </select>
              </div>
            )}

            {!isCouponDelivery && (
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Admin Notes</span></label>
                <textarea className="textarea textarea-bordered w-full" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
              </div>
            )}

            <button type="submit" className={`btn btn-primary ${saving ? "loading" : ""}`} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
