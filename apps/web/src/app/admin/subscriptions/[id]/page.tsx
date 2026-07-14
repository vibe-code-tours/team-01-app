"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface SubscriptionDetail {
  id: string;
  userId: string;
  status: string;
  couponsRemaining: number;
  couponCount: number;
  createdAt: string;
  expiresAt: string;
  userName: string | null;
  userEmail: string | null;
  packageName: string | null;
  packageDescription: string | null;
  packagePrice: string | null;
}

export default function SubscriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await adminFetch<SubscriptionDetail>(`/subscriptions/${id}`);
      if (result.success && result.data) {
        setSubscription(result.data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  if (!subscription) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Subscription not found</p>
      </div>
    );
  }

  const used = subscription.couponCount - subscription.couponsRemaining;

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => router.back()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Detail</h1>
          <p className="text-sm text-gray-500 mt-0.5 font-mono text-xs">{subscription.id}</p>
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Customer</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Name</span>
            <span className="text-sm font-medium text-gray-900">{subscription.userName || "Unknown"}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Email</span>
            <span className="text-sm text-gray-700">{subscription.userEmail}</span>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Subscription Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Status</span>
            <StatusBadge value={subscription.status} variant="subscription" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Package</span>
            <span className="text-sm font-medium text-gray-900">{subscription.packageName || "Unknown"}</span>
          </div>
          {subscription.packagePrice && (
            <div>
              <span className="text-xs text-gray-400 block mb-0.5">Price</span>
              <span className="text-sm font-semibold text-gray-900 tabular-nums">{Number(subscription.packagePrice).toLocaleString()} <span className="text-xs font-normal text-gray-400">MMK</span></span>
            </div>
          )}
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Coupons</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{subscription.couponsRemaining} / {subscription.couponCount} remaining</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Start Date</span>
            <span className="text-sm text-gray-700">{new Date(subscription.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">End Date</span>
            <span className="text-sm text-gray-700">{new Date(subscription.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          {subscription.packageDescription && (
            <div className="col-span-2">
              <span className="text-xs text-gray-400 block mb-0.5">Description</span>
              <span className="text-sm text-gray-700">{subscription.packageDescription}</span>
            </div>
          )}
        </div>
      </div>

      {/* Coupon Usage */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Coupon Usage</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{subscription.couponCount}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Remaining</p>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">{subscription.couponsRemaining}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Used</p>
            <p className="text-2xl font-bold text-amber-700 tabular-nums">{used}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
