"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface SubscriptionPackage {
  id: string;
  name: string;
  couponCount: number;
  price: string;
  description: string | null;
  expiresInDays: number;
  status: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SubscriptionPackagesPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", couponCount: "", price: "", description: "", expiresInDays: "30" });
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [search]);

  async function loadPackages() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);

    const result = await adminFetch<{ packages: SubscriptionPackage[]; pagination: PaginationData }>(`/subscription-packages?${params}`);
    if (result.success && result.data) {
      setPackages(result.data.packages);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPackages();
  }, [page, debouncedSearch, statusFilter]);

  function toggleCreateForm() {
    const next = !showCreate;
    setShowCreate(next);
    if (!next) {
      setFormMsg("");
      setForm({ name: "", couponCount: "", price: "", description: "", expiresInDays: "30" });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormMsg("");

    const body: Record<string, unknown> = {
      name: form.name,
      couponCount: Number(form.couponCount),
      price: Number(form.price),
      expiresInDays: Number(form.expiresInDays) || 30,
    };
    if (form.description.trim()) body.description = form.description.trim();

    const result = await adminFetch("/subscription-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setCreating(false);
    if (result.success) {
      setShowCreate(false);
      setFormMsg("");
      setForm({ name: "", couponCount: "", price: "", description: "", expiresInDays: "30" });
      loadPackages();
    } else {
      setFormMsg(result.error || "Failed to create package");
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this package?")) return;
    const result = await adminFetch(`/subscription-packages/${id}`, { method: "DELETE" });
    if (result.success) {
      loadPackages();
    } else {
      alert(result.error || "Failed to deactivate");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Packages</h1>
        <button className="btn btn-primary btn-sm" onClick={toggleCreateForm}>
          {showCreate ? "Cancel" : "+ Create Package"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="card-body">
            <h2 className="card-title">Create Package</h2>
            {formMsg && (
              <div className="alert alert-error mb-4">
                <span>{formMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                  <input type="text" className="input input-bordered w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Starter, Regular, Premium" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Coupon Count <span className="text-red-500">*</span></label>
                  <input type="number" className="input input-bordered w-full" value={form.couponCount} onChange={(e) => setForm({ ...form, couponCount: e.target.value })} required min="1" step="1" placeholder="5" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (MMK) <span className="text-red-500">*</span></label>
                  <input type="number" className="input input-bordered w-full" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.01" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Expires In (Days)</label>
                  <input type="number" className="input input-bordered w-full" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} min="1" step="1" placeholder="30" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea className="textarea textarea-bordered w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Package description" />
                </div>
              </div>
              <div>
                <button type="submit" className={`btn btn-primary w-full ${creating ? "loading" : ""}`} disabled={creating}>
                  {creating ? "Creating..." : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search packages..."
            className="input input-bordered w-full max-w-xs"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="select select-bordered" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No packages found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Coupons</th>
                  <th>Price</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td className="font-medium">{pkg.name}</td>
                    <td>{pkg.couponCount}</td>
                    <td>{Number(pkg.price).toLocaleString()} MMK</td>
                    <td>{pkg.expiresInDays} days</td>
                    <td><StatusBadge value={pkg.status} variant="product" /></td>
                    <td>{new Date(pkg.createdAt).toLocaleDateString()}</td>
                    <td className="flex gap-1">
                      <Link href={`/admin/subscription-packages/${pkg.id}`} className="btn btn-ghost btn-xs">Edit</Link>
                      {pkg.status === "active" && (
                        <button onClick={() => handleDeactivate(pkg.id)} className="btn btn-ghost btn-xs text-error">Deactivate</button>
                      )}
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
