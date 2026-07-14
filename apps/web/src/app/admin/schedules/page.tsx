"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";

interface Province { id: string; name: string; }
interface Township { id: string; name: string; }
interface Schedule {
  id: string;
  provinceId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  maxOrders: number;
  currentOrders: number;
  isProvinceWide: boolean;
  createdAt: string;
  provinceName: string | null;
  townshipNames: string[];
}
interface PaginationData { page: number; limit: number; total: number; totalPages: number; }

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filterTownships, setFilterTownships] = useState<Township[]>([]);
  const [formTownships, setFormTownships] = useState<Township[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [provinceFilter, setProvinceFilter] = useState("");
  const [townshipFilter, setTownshipFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [formProvinceId, setFormProvinceId] = useState("");
  const [formIsProvinceWide, setFormIsProvinceWide] = useState(true);
  const [formDates, setFormDates] = useState<string[]>([]);
  const [formTimeStart, setFormTimeStart] = useState("08:00");
  const [formTimeEnd, setFormTimeEnd] = useState("17:00");
  const [formMaxOrders, setFormMaxOrders] = useState("50");
  const [formTownshipIds, setFormTownshipIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  async function loadProvincesList() {
    const result = await adminFetch<{ provinces: Province[] }>("/provinces?limit=100");
    if (result.success && result.data) setProvinces(result.data.provinces);
  }

  async function loadTownshipsForProvince(provinceId: string, target: "filter" | "form") {
    if (!provinceId) { if (target === "filter") setFilterTownships([]); else setFormTownships([]); return; }
    const result = await adminFetch<Township[]>(`/townships-by-province/${provinceId}`);
    const list = result.success && result.data ? result.data : [];
    if (target === "filter") setFilterTownships(list); else setFormTownships(list);
  }

  async function loadSchedules() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (provinceFilter) params.set("provinceId", provinceFilter);
    if (dateFilter) params.set("date", dateFilter);
    if (townshipFilter) params.set("townshipId", townshipFilter);

    const result = await adminFetch<{ schedules: Schedule[]; pagination: PaginationData }>(`/schedules?${params}`);
    if (result.success && result.data) {
      setSchedules(result.data.schedules);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => { loadProvincesList(); }, []);
  useEffect(() => { loadSchedules(); }, [page, provinceFilter, dateFilter, townshipFilter]);

  useEffect(() => {
    loadTownshipsForProvince(provinceFilter, "filter");
    setTownshipFilter("");
  }, [provinceFilter]);

  useEffect(() => {
    loadTownshipsForProvince(formProvinceId, "form");
    setFormTownshipIds([]);
  }, [formProvinceId]);

  function toggleCreateForm() {
    const next = !showCreate;
    setShowCreate(next);
    if (!next) setFormMsg("");
  }

  function addDate(d: string) {
    if (d && !formDates.includes(d)) {
      setFormDates((prev) => [...prev, d].sort());
    }
  }

  function removeDate(d: string) {
    setFormDates((prev) => prev.filter((x) => x !== d));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormMsg("");

    const body: Record<string, unknown> = {
      provinceId: formProvinceId,
      dates: formDates,
      timeStart: formTimeStart,
      timeEnd: formTimeEnd,
      maxOrders: Number(formMaxOrders),
      isProvinceWide: formIsProvinceWide,
    };
    if (!formIsProvinceWide) {
      body.townshipIds = formTownshipIds;
    }

    const result = await adminFetch("/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setCreating(false);
    if (result.success) {
      setShowCreate(false);
      setFormMsg("");
      setFormProvinceId(""); setFormDates([]); setFormTownshipIds([]);
      loadSchedules();
    } else {
      setFormMsg(result.error || "Failed to create schedule");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this schedule?")) return;
    const result = await adminFetch(`/schedules/${id}`, { method: "DELETE" });
    if (result.success) loadSchedules();
    else alert(result.error || "Failed to delete");
  }

  function toggleTownship(tid: string) {
    setFormTownshipIds((prev) => prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid]);
  }

  function selectAllTownships() {
    setFormTownshipIds(formTownships.map((t) => t.id));
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
          <p className="text-sm text-gray-500 mt-1">Manage delivery schedules across provinces</p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={toggleCreateForm}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showCreate ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showCreate ? "Cancel" : "Create Schedule"}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-100 mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Schedule</h2>
          {formMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {formMsg}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formProvinceId}
                  onChange={(e) => setFormProvinceId(e.target.value)}
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Add Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  onChange={(e) => { addDate(e.target.value); e.target.value = ""; }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Time Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formTimeStart}
                  onChange={(e) => setFormTimeStart(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Time End <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formTimeEnd}
                  onChange={(e) => setFormTimeEnd(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max Orders <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formMaxOrders}
                  onChange={(e) => setFormMaxOrders(e.target.value)}
                  min="1"
                  required
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formIsProvinceWide ? "true" : "false"}
                  onChange={(e) => setFormIsProvinceWide(e.target.value === "true")}
                >
                  <option value="true">Province Wide</option>
                  <option value="false">Specific Townships</option>
                </select>
              </div>
            </div>

            {/* Selected Dates */}
            {formDates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formDates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-lg">
                    {new Date(d + "T00:00:00").toLocaleDateString()}
                    <button type="button" className="text-primary/60 hover:text-primary transition-colors" onClick={() => removeDate(d)}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Township Checkboxes */}
            {!formIsProvinceWide && formProvinceId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Townships</label>
                {formTownships.length === 0 ? (
                  <p className="text-sm text-gray-500">No active townships in this province.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                    <button type="button" className="text-xs text-primary font-medium hover:text-primary/80 mb-2 transition-colors" onClick={selectAllTownships}>
                      Select All
                    </button>
                    {formTownships.map((t) => (
                      <label key={t.id} className="flex items-center gap-2.5 cursor-pointer py-1.5">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm border-gray-300 checked:bg-primary checked:border-primary"
                          checked={formTownshipIds.includes(t.id)}
                          onChange={() => toggleTownship(t.id)}
                        />
                        <span className="text-sm text-gray-700">{t.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div>
              <button
                type="submit"
                className="btn btn-primary btn-sm duration-150"
                disabled={creating || formDates.length === 0}
              >
                {creating ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {creating ? "Creating..." : `Create ${formDates.length > 0 ? formDates.length + " " : ""}Schedule${formDates.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={provinceFilter}
            onChange={(e) => { setProvinceFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Provinces</option>
            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
            value={townshipFilter}
            onChange={(e) => { setTownshipFilter(e.target.value); setPage(1); }}
            disabled={!provinceFilter}
          >
            <option value="">All Townships</option>
            {filterTownships.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input
            type="date"
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex justify-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No schedules found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Province</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Townships</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Time</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Capacity</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.provinceName || "-"}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.townshipNames.map((name) => (
                          <span key={name} className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                            {name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-medium">
                        {new Date(s.date + "T00:00:00").toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{s.timeStart} - {s.timeEnd}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-900">{s.currentOrders}</span>
                      <span className="text-sm text-gray-400">/{s.maxOrders}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/admin/schedules/${s.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 hover:text-primary hover:bg-primary/10 transition-colors duration-150"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        {s.currentOrders === 0 && (
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
