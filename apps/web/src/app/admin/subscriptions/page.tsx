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
  couponsTotal: number;
  startDate: string;
  endDate: string;
  createdAt: string;
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
      <h1 className="text-2xl font-bold mb-6">Subscriptions</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <select className="select select-bordered" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-8 text-base-content/60">No subscriptions found.</div>
      ) : (
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
                    <div className="text-xs text-base-content/60">{sub.userEmail}</div>
                  </td>
                  <td>{sub.packageName || "-"}</td>
                  <td>{sub.couponsRemaining} / {sub.couponsTotal}</td>
                  <td><StatusBadge value={sub.status} variant="subscription" /></td>
                  <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                  <td>{new Date(sub.endDate).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/subscriptions/${sub.id}`} className="btn btn-ghost btn-xs">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
