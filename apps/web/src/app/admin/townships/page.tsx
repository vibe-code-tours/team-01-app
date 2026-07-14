"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";

interface Township {
  id: string;
  name: string;
  provinceId: string;
  isActive: boolean;
  createdAt: string;
  provinceName: string | null;
}

interface Province {
  id: string;
  name: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TownshipsPage() {
  const [townships, setTownships] = useState<Township[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createProvinceId, setCreateProvinceId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  async function loadProvincesList() {
    const result = await adminFetch<{ provinces: Province[] }>("/provinces?limit=100");
    if (result.success && result.data) {
      setProvinces(result.data.provinces);
    }
  }

  async function loadTownships() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (provinceFilter) params.set("provinceId", provinceFilter);

    const result = await adminFetch<{ townships: Township[]; pagination: PaginationData }>(`/townships?${params}`);
    if (result.success && result.data) {
      setTownships(result.data.townships);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProvincesList();
  }, []);

  useEffect(() => {
    loadTownships();
  }, [page, search, statusFilter, provinceFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");

    const result = await adminFetch("/townships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName, provinceId: createProvinceId }),
    });

    setCreating(false);
    if (result.success) {
      setCreateMsg("Township created successfully");
      setCreateName("");
      setCreateProvinceId("");
      setShowCreate(false);
      loadTownships();
    } else {
      setCreateMsg(result.error || "Failed to create township");
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this township?")) return;
    const result = await adminFetch(`/townships/${id}`, { method: "DELETE" });
    if (result.success) {
      loadTownships();
    } else {
      alert(result.error || "Failed to deactivate");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Townships</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Create Township"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="card-body">
            <h2 className="card-title">Create Township</h2>
            {createMsg && (
              <div className="alert alert-error mb-4">
                <span>{createMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                  <input type="text" className="input input-bordered w-full" value={createName} onChange={(e) => setCreateName(e.target.value)} required placeholder="Enter township name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Province <span className="text-red-500">*</span></label>
                  <select className="select select-bordered w-full" value={createProvinceId} onChange={(e) => setCreateProvinceId(e.target.value)} required>
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <button type="submit" className={`btn btn-primary w-full ${creating ? "loading" : ""}`} disabled={creating}>
                  {creating ? "Creating..." : "Create Township"}
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
            placeholder="Search townships..."
            className="input input-bordered w-full max-w-xs"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="select select-bordered" value={provinceFilter} onChange={(e) => { setProvinceFilter(e.target.value); setPage(1); }}>
            <option value="">All Provinces</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
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
      ) : townships.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No townships found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Province</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {townships.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}</td>
                    <td>{t.provinceName || "-"}</td>
                    <td>
                      <span className={`badge ${t.isActive ? "badge-success" : "badge-warning"}`}>
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="flex gap-1">
                      <Link href={`/admin/townships/${t.id}`} className="btn btn-ghost btn-xs">Edit</Link>
                      {t.isActive && (
                        <button onClick={() => handleDeactivate(t.id)} className="btn btn-ghost btn-xs text-error">Deactivate</button>
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
