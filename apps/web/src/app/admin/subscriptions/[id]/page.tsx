"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface SubscriptionDetail {
  id: string;
  userId: string;
  packageId: string;
  status: string;
  couponsRemaining: number;
  couponsTotal: number;
  startDate: string;
  endDate: string;
  createdAt: string;
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
    return <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (!subscription) {
    return <div className="text-center py-8">Subscription not found</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold">Subscription Detail</h1>
      </div>

      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title">Customer</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">Name:</span> {subscription.userName || "Unknown"}</div>
            <div><span className="font-semibold">Email:</span> {subscription.userEmail}</div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow mb-6">
        <div className="card-body">
          <h2 className="card-title">Subscription Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold">ID:</span> <span className="font-mono">{subscription.id}</span></div>
            <div><span className="font-semibold">Status:</span> <StatusBadge value={subscription.status} variant="subscription" /></div>
            <div><span className="font-semibold">Package:</span> {subscription.packageName || "Unknown"}</div>
            {subscription.packagePrice && (
              <div><span className="font-semibold">Price:</span> {Number(subscription.packagePrice).toLocaleString()} MMK</div>
            )}
            <div><span className="font-semibold">Coupons Remaining:</span> {subscription.couponsRemaining} / {subscription.couponsTotal}</div>
            <div><span className="font-semibold">Start Date:</span> {new Date(subscription.startDate).toLocaleDateString()}</div>
            <div><span className="font-semibold">End Date:</span> {new Date(subscription.endDate).toLocaleDateString()}</div>
            <div><span className="font-semibold">Created:</span> {new Date(subscription.createdAt).toLocaleDateString()}</div>
          </div>
          {subscription.packageDescription && (
            <div className="mt-4 text-sm">
              <span className="font-semibold">Package Description:</span>
              <p className="mt-1">{subscription.packageDescription}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Coupon Usage</h2>
          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-title">Total Coupons</div>
              <div className="stat-value">{subscription.couponsTotal}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Remaining</div>
              <div className="stat-value text-success">{subscription.couponsRemaining}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Used</div>
              <div className="stat-value text-warning">{subscription.couponsTotal - subscription.couponsRemaining}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
