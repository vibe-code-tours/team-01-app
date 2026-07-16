"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userFetch, fetchSession } from "@/lib/api-client";
import type { Socket } from "socket.io-client";
import { getSocket, onSocketReady, connectSocket } from "@/lib/socket";

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

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-[#EDF3F8]", text: "text-[#4A6B85]" },
  paid: { bg: "bg-[#FFF0DC]", text: "text-[#9A6116]" },
  approved: { bg: "bg-[#DEF3F2]", text: "text-[#136F6D]" },
  scheduled: { bg: "bg-[#E3EDF7]", text: "text-[#1C4E80]" },
  assigned: { bg: "bg-[#FBE7D2]", text: "text-[#8A4B12]" },
  delivered: { bg: "bg-[#DFF3E6]", text: "text-[#1E7A46]" },
  cancelled: { bg: "bg-[#EFF1F3]", text: "text-[#6B8299]" },
  rejected: { bg: "bg-[#FDE7E5]", text: "text-[#B3261E]" },
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

const orderTypeLabels: Record<string, string> = {
  retail: "Retail",
  subscription: "Subscription",
  "coupon-delivery": "Coupon",
};

function formatPrice(price: string | number) {
  return new Intl.NumberFormat("en-US", { style: "decimal", maximumFractionDigits: 0 }).format(Number(price));
}

function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {statusLabels[status] || status}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [couponDeliveries, setCouponDeliveries] = useState<CouponDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOrders = useCallback(async () => {
    const res = await userFetch<{ orders: Order[] }>("/orders?limit=5");
    if (res.success && res.data) setOrders(res.data.orders || []);
  }, []);

  const refreshDeliveries = useCallback(async () => {
    const res = await userFetch<{ deliveries: CouponDelivery[] }>("/coupon-deliveries?status=pending&limit=5");
    if (res.success && res.data) setCouponDeliveries(res.data.deliveries || []);
  }, []);

  // Real-time updates via Socket.IO
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    let mounted = true;
    let attached = false;

    function attach(socket: Socket) {
      if (attached) return;
      attached = true;
      const onStatusChanged = () => { if (mounted) { refreshOrders(); refreshDeliveries(); } };
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
  }, [refreshOrders, refreshDeliveries]);

  useEffect(() => {
    async function init() {
      const session = await fetchSession();
      if (!session.success) {
        router.push("/login");
        return;
      }

      // Ensure socket is connected for real-time updates
      connectSocket();

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
        setActiveSubscriptions(activeSubs);
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
      <div className="max-w-6xl mx-auto px-4 py-16 flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const totalCouponsRemaining = activeSubscriptions.reduce((sum, s) => sum + s.couponsRemaining, 0);
  const totalCouponCount = activeSubscriptions.reduce((sum, s) => sum + s.couponCount, 0);
  const hasSubscription = activeSubscriptions.length > 0;
  const pendingDeliveries = couponDeliveries.length;
  const totalOrders = orders.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}
        </h1>
        {profile?.provinceName && (
          <p className="text-base-content/50 mt-1 flex items-center gap-1.5 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {profile.provinceName}{profile.townshipName ? `, ${profile.townshipName}` : ""}
          </p>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">

        {/* Stat: Coupons Remaining */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 text-white card-hover animate-fade-in-up cursor-default">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/70 text-xs font-medium uppercase tracking-wider">Coupons</span>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold">{totalCouponsRemaining}</p>
          <p className="text-white/60 text-xs mt-1">available for delivery</p>
        </div>

        {/* Stat: Pending Deliveries */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 card-hover animate-fade-in-up cursor-default">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base-content/50 text-xs font-medium uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-base-content">{pendingDeliveries}</p>
          <p className="text-base-content/50 text-xs mt-1">scheduled deliveries</p>
        </div>

        {/* Stat: Total Orders */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 card-hover animate-fade-in-up cursor-default">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base-content/50 text-xs font-medium uppercase tracking-wider">Orders</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-base-content">{totalOrders}</p>
          <p className="text-base-content/50 text-xs mt-1">total orders placed</p>
        </div>

        {/* Quick Action: Order Water */}
        <Link
          href="/products"
          className="group bg-base-100 border border-base-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 card-hover animate-fade-in-up text-center cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary group-hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-base-content">Order Water</span>
          <span className="text-xs text-base-content/50">Browse products</span>
        </Link>

        {/* Subscription Card — spans 2 cols on sm+ */}
        {hasSubscription ? (
          <div className="sm:col-span-2 bg-base-100 border border-base-200 rounded-2xl p-6 animate-fade-in-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-base-content">My Subscriptions</h3>
                <p className="text-sm text-base-content/50 mt-0.5">
                  {activeSubscriptions.length} active plan{activeSubscriptions.length > 1 ? "s" : ""} &middot; {totalCouponsRemaining} coupons left
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>

            {/* Overall progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-base-content/50 mb-1.5">
                <span>{totalCouponsRemaining} of {totalCouponCount} coupons remaining</span>
                <span>{totalCouponCount > 0 ? Math.round((totalCouponsRemaining / totalCouponCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-base-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalCouponCount > 0 ? (totalCouponsRemaining / totalCouponCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Individual subscriptions */}
            <div className="space-y-2 mb-4">
              {activeSubscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-xl bg-base-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-base-content">{sub.packageName}</p>
                      <p className="text-xs text-base-content/50">
                        Expires {new Date(sub.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary tabular-nums">{sub.couponsRemaining}</span>
                    <span className="text-xs text-base-content/40">/ {sub.couponCount}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Link href="/coupon-deliveries" className="btn btn-primary btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule Delivery
              </Link>
              <Link href="/subscription" className="btn btn-ghost btn-sm text-base-content/60">
                View Plans
              </Link>
            </div>
          </div>
        ) : (
          <div className="sm:col-span-2 bg-gradient-to-br from-primary/5 to-cyan-500/5 border border-dashed border-base-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h3 className="font-semibold text-base-content mb-1">No Active Subscription</h3>
            <p className="text-sm text-base-content/50 mb-3">Get a plan to start ordering water deliveries</p>
            <Link href="/subscription" className="btn btn-primary btn-sm">
              Browse Plans
            </Link>
          </div>
        )}

        {/* Quick Action: Subscribe */}
        <Link
          href="/subscription"
          className="group bg-base-100 border border-base-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 card-hover animate-fade-in-up text-center cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-500 group-hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-base-content">Subscribe</span>
          <span className="text-xs text-base-content/50">Get coupon plans</span>
        </Link>

        {/* Quick Action: Profile */}
        <Link
          href="/profile/complete"
          className="group bg-base-100 border border-base-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 card-hover animate-fade-in-up text-center cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-500 group-hover:text-white transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-base-content">Profile</span>
          <span className="text-xs text-base-content/50">Manage account</span>
        </Link>

        {/* Scheduled Deliveries — spans 2 cols on lg */}
        {couponDeliveries.length > 0 && (
          <div className="lg:col-span-2 bg-base-100 border border-base-200 rounded-2xl p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base-content flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Scheduled Deliveries
              </h3>
            </div>
            <div className="space-y-2.5">
              {couponDeliveries.map((d) => (
                <Link
                  key={d.id}
                  href={`/coupon-deliveries/${d.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-base-content">{d.bottleCount} x 20L Bottles</p>
                      <p className="text-xs text-base-content/50">{formatDateShort(d.scheduleDate)} {d.scheduleTimeStart} - {d.scheduleTimeEnd}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/30 group-hover:text-base-content/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders — spans 2 cols on lg */}
        <div className="lg:col-span-2 bg-base-100 border border-base-200 rounded-2xl p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base-content flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Recent Orders
            </h3>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-sm text-base-content/50 mb-2">No orders yet</p>
              <Link href="/products" className="text-sm text-primary font-medium hover:underline">
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-base-200/50 transition-colors duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-base-content/50">
                        {(orderTypeLabels[order.orderType] || order.orderType).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-base-content">
                        {orderTypeLabels[order.orderType] || order.orderType}
                      </p>
                      <p className="text-xs text-base-content/50">{formatDateShort(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.orderType !== "coupon-delivery" && (
                      <span className="text-sm font-semibold text-base-content tabular-nums">
                        {formatPrice(order.totalAmount)} <span className="text-xs font-normal text-base-content/50">MMK</span>
                      </span>
                    )}
                    <StatusBadge status={order.status} />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/30 group-hover:text-base-content/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
