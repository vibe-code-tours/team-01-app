"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";

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
  const [formMsg, setFormMsg] = useState("");

  const loadProvinces = useCallback(async () => {
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
  }, [page, search, statusFilter]);

  useEffect(() => { loadProvinces(); }, [loadProvinces]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormMsg("");

    const result = await adminFetch("/provinces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createName }),
    });

    setCreating(false);
    if (result.success) {
      setCreateName("");
      setShowCreate(false);
      loadProvinces();
    } else {
      setFormMsg(result.error || "Failed to create province");
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this province?")) return;
    const result = await adminFetch(`/provinces/${id}`, { method: "DELETE" });
    if (result.success) loadProvinces();
    else alert(result.error || "Failed to deactivate");
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provinces</h1>
          <p className="text-sm text-gray-500 mt-1">Manage delivery provinces</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowCreate(!showCreate); setFormMsg(""); }}>
          {showCreate ? "Cancel" : (
            <><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Create Province</>
          )}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 animate-fade-in-up">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Create Province</h2>
          {formMsg && <div className="px-4 py-3 rounded-xl text-sm font-medium mb-4 bg-red-50 text-red-700">{formMsg}</div>}
          <form onSubmit={handleCreate}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
              <input type="text" className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={createName} onChange={(e) => setCreateName(e.target.value)} required placeholder="Enter province name" />
            </div>
            <button type="submit" className="mt-4 btn btn-primary btn-sm" disabled={creating}>
              {creating && <span className="loading loading-spinner loading-sm"></span>}
              {creating ? "Creating..." : "Create Province"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Search provinces..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></div>
        ) : provinces.length === 0 ? (
          <div className="text-center py-12"><div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div><p className="text-sm text-gray-400">No provinces found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Created</th>
                  <th className="w-20 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {provinces.map((p) => (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-5 py-3"><span className="text-sm font-medium text-gray-900">{p.name}</span></td>
                    <td className="px-5 py-3"><StatusBadge value={p.isActive ? "active" : "inactive"} variant="product" /></td>
                    <td className="px-5 py-3"><span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/provinces/${p.id}`} className="text-gray-300 hover:text-primary transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </Link>
                        {p.isActive && (
                          <button onClick={() => handleDeactivate(p.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
