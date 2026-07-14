"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userFetch, fetchSession } from "@/lib/api-client";

interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  provinceName: string | null;
  townshipName: string | null;
}

interface Subscription {
  id: string;
  packageName: string;
  couponsRemaining: number;
  couponCount: number;
  expiresAt: string;
}

interface Order {
  id: string;
  orderType: string;
  totalAmount: string;
  status: string;
  createdAt: string;
}

interface CouponDelivery {
  id: string;
  bottleCount: number;
  status: string;
  createdAt: string;
  scheduleDate: string;
  scheduleTimeStart: string;
  scheduleTimeEnd: string;
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
  pending: "Pending",
  paid: "Paid",
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

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couponDeliveries, setCouponDeliveries] = useState<CouponDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const session = await fetchSession();
      if (!session.success) {
        router.push("/login");
        return;
      }

      const [profileRes, subsRes, ordersRes, deliveriesRes] = await Promise.all([
        userFetch<UserProfile>("/profile"),
        userFetch<Subscription[]>("/subscriptions"),
        userFetch<{ orders: Order[] }>("/orders?limit=5"),
        userFetch<{ deliveries: CouponDelivery[] }>("/coupon-deliveries?status=pending&limit=5"),
      ]);

      if (profileRes.success && profileRes.data) setProfile(profileRes.data);
      if (subsRes.success && subsRes.data) {
        const activeSubs = subsRes.data.filter(
          (s) => s.couponsRemaining > 0 && new Date(s.expiresAt) > new Date()
        );
        if (activeSubs.length > 0) {
          const totalCouponsRemaining = activeSubs.reduce((sum, s) => sum + s.couponsRemaining, 0);
          const totalCouponCount = activeSubs.reduce((sum, s) => sum + s.couponCount, 0);
          const earliestExpiry = activeSubs.reduce((earliest, s) => {
            const exp = new Date(s.expiresAt);
            return exp < earliest ? exp : earliest;
          }, new Date(activeSubs[0].expiresAt));
          setSubscription({
            id: activeSubs.map((s) => s.id).join(","),
            packageName: `${activeSubs.length} Active Plan${activeSubs.length > 1 ? "s" : ""}`,
            couponsRemaining: totalCouponsRemaining,
            couponCount: totalCouponCount,
            expiresAt: earliestExpiry.toISOString(),
          });
        } else {
          setSubscription(null);
        }
      }
      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data.orders || []);
      }
      if (deliveriesRes.success && deliveriesRes.data) {
        setCouponDeliveries(deliveriesRes.data.deliveries || []);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome{profile?.name ? `, ${profile.name}` : ""}</h1>
        {profile?.provinceName && (
          <p className="text-base-content/50">
            {profile.provinceName}{profile.townshipName ? `, ${profile.townshipName}` : ""}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link href="/products" className="btn btn-primary btn-lg">
          Order Products
        </Link>
        <Link href="/subscription" className="btn btn-outline btn-lg">
          Buy Subscription
        </Link>
      </div>

      {/* Active Subscription */}
      {subscription && (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-semibold text-lg">Active Subscription</h2>
              <p className="text-sm text-base-content/50">{subscription.packageName}</p>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-3xl font-bold text-primary">
                {subscription.couponsRemaining}
              </p>
              <p className="text-sm text-base-content/50">
                coupons remaining
              </p>
            </div>
            <div>
              <p className="text-sm text-base-content/50">Earliest Expiry</p>
              <p className="font-medium">{new Date(subscription.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-base-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${(subscription.couponsRemaining / subscription.couponCount) * 100}%`,
                }}
              />
            </div>
          </div>
          {subscription.couponsRemaining > 0 && (
            <Link href="/coupon-deliveries" className="btn btn-primary btn-sm mt-4">
              Schedule Delivery
            </Link>
          )}
        </div>
      )}

      {/* Scheduled Deliveries */}
      {couponDeliveries.length > 0 && (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">My Scheduled Deliveries</h2>
          <div className="space-y-3">
            {couponDeliveries.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{d.bottleCount} x 20L Water Bottle</p>
                  <p className="text-xs text-base-content/50">{d.scheduleDate} {d.scheduleTimeStart} — {d.scheduleTimeEnd}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge badge-sm ${statusColors[d.status] || "badge-ghost"}`}>
                    {statusLabels[d.status] || d.status}
                  </span>
                  <Link href={`/coupon-deliveries/${d.id}`} className="btn btn-ghost btn-xs">View</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6">
        <h2 className="font-semibold text-lg mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-base-content/50 text-center py-8">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="text-sm capitalize">{order.orderType}</td>
                    <td className="text-sm font-medium">{formatPrice(order.totalAmount)} MMK</td>
                    <td>
                      <span className={`badge badge-sm ${statusColors[order.status] || "badge-ghost"}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/orders/${order.id}`} className="btn btn-ghost btn-xs">
                        View
                      </Link>
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
