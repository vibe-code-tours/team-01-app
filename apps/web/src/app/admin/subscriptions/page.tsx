"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface Subscription {
  id: string;
  status: string;
  couponsRemaining: number;
  couponCount: number;
  createdAt: string;
  expiresAt: string;
  userName: string | null;
  userEmail: string | null;
  packageName: string | null;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function loadSubscriptions() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (statusFilter) params.set("status", statusFilter);

    const result = await adminFetch<{ subscriptions: Subscription[]; pagination: PaginationData }>(`/subscriptions?${params}`);
    if (result.success && result.data) {
      setSubscriptions(result.data.subscriptions);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSubscriptions();
  }, [page, statusFilter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Subscriptions</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select className="select select-bordered" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No subscriptions found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Package</th>
                  <th>Coupons</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div>{sub.userName || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{sub.userEmail}</div>
                    </td>
                    <td>{sub.packageName || "-"}</td>
                    <td>{sub.couponsRemaining} / {sub.couponCount}</td>
                    <td><StatusBadge value={sub.status} variant="subscription" /></td>
                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(sub.expiresAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/admin/subscriptions/${sub.id}`} className="btn btn-ghost btn-xs">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
