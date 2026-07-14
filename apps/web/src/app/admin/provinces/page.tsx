"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";

interface Province {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProvincesPage() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  async function loadProvinces() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    const result = await adminFetch<{ provinces: Province[]; pagination: PaginationData }>(`/provinces?${params}`);
    if (result.success && result.data) {
      setProvinces(result.data.provinces);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProvinces();
  }, [page, search, statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");

    const result = await adminFetch("/provinces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName }),
    });

    setCreating(false);
    if (result.success) {
      setCreateMsg("Province created successfully");
      setCreateName("");
      setShowCreate(false);
      loadProvinces();
    } else {
      setCreateMsg(result.error || "Failed to create province");
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this province?")) return;
    const result = await adminFetch(`/provinces/${id}`, { method: "DELETE" });
    if (result.success) {
      loadProvinces();
    } else {
      alert(result.error || "Failed to deactivate");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Provinces</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Create Province"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="card-body">
            <h2 className="card-title">Create Province</h2>
            {createMsg && (
              <div className="alert alert-error mb-4">
                <span>{createMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                <input type="text" className="input input-bordered w-full" value={createName} onChange={(e) => setCreateName(e.target.value)} required placeholder="Enter province name" />
              </div>
              <div>
                <button type="submit" className={`btn btn-primary w-full ${creating ? "loading" : ""}`} disabled={creating}>
                  {creating ? "Creating..." : "Create Province"}
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
            placeholder="Search provinces..."
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
      ) : provinces.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No provinces found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {provinces.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.name}</td>
                    <td>
                      <span className={`badge ${p.isActive ? "badge-success" : "badge-warning"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="flex gap-1">
                      <Link href={`/admin/provinces/${p.id}`} className="btn btn-ghost btn-xs">Edit</Link>
                      {p.isActive && (
                        <button onClick={() => handleDeactivate(p.id)} className="btn btn-ghost btn-xs text-error">Deactivate</button>
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
