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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
        <button className="btn btn-primary btn-sm" onClick={toggleCreateForm}>
          {showCreate ? "Cancel" : "+ Create Schedule"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="card-body">
            <h2 className="card-title">Create Schedule</h2>
            {formMsg && (
              <div className="alert alert-error mb-4">
                <span>{formMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Province <span className="text-red-500">*</span></label>
                  <select className="select select-bordered w-full" value={formProvinceId} onChange={(e) => setFormProvinceId(e.target.value)} required>
                    <option value="">Select Province</option>
                    {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Add Date <span className="text-red-500">*</span></label>
                  <input type="date" className="input input-bordered w-full" onChange={(e) => { addDate(e.target.value); e.target.value = ""; }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time Start <span className="text-red-500">*</span></label>
                  <input type="time" className="input input-bordered w-full" value={formTimeStart} onChange={(e) => setFormTimeStart(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time End <span className="text-red-500">*</span></label>
                  <input type="time" className="input input-bordered w-full" value={formTimeEnd} onChange={(e) => setFormTimeEnd(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Orders <span className="text-red-500">*</span></label>
                  <input type="number" className="input input-bordered w-full" value={formMaxOrders} onChange={(e) => setFormMaxOrders(e.target.value)} min="1" required placeholder="50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                  <select className="select select-bordered w-full" value={formIsProvinceWide ? "true" : "false"} onChange={(e) => setFormIsProvinceWide(e.target.value === "true")}>
                    <option value="true">Province Wide</option>
                    <option value="false">Specific Townships</option>
                  </select>
                </div>
              </div>

              {formDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formDates.map((d) => (
                    <span key={d} className="badge badge-outline gap-1">
                      {new Date(d + "T00:00:00").toLocaleDateString()}
                      <button type="button" className="text-error text-xs font-bold" onClick={() => removeDate(d)}>x</button>
                    </span>
                  ))}
                </div>
              )}

              {!formIsProvinceWide && formProvinceId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Townships</label>
                  {formTownships.length === 0 ? (
                    <p className="text-sm text-gray-500">No active townships in this province.</p>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <button type="button" className="btn btn-ghost btn-xs mb-2" onClick={selectAllTownships}>Select All</button>
                      {formTownships.map((t) => (
                        <label key={t.id} className="flex items-center gap-2 cursor-pointer py-1">
                          <input type="checkbox" className="checkbox checkbox-sm" checked={formTownshipIds.includes(t.id)} onChange={() => toggleTownship(t.id)} />
                          <span className="text-sm">{t.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <button type="submit" className={`btn btn-primary w-full ${creating ? "loading" : ""}`} disabled={creating || formDates.length === 0}>
                  {creating ? "Creating..." : `Create ${formDates.length > 0 ? formDates.length + " " : ""}Schedule${formDates.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <select className="select select-bordered" value={provinceFilter} onChange={(e) => { setProvinceFilter(e.target.value); setPage(1); }}>
            <option value="">All Provinces</option>
            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select select-bordered" value={townshipFilter} onChange={(e) => { setTownshipFilter(e.target.value); setPage(1); }} disabled={!provinceFilter}>
            <option value="">All Townships</option>
            {filterTownships.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="date" className="input input-bordered" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg"></span></div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No schedules found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Province</th>
                  <th>Townships</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Capacity</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.provinceName || "-"}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {s.townshipNames.map((name) => (
                          <span key={name} className={`badge badge-sm ${s.isProvinceWide ? "badge-info" : "badge-ghost"}`}>{name}</span>
                        ))}
                      </div>
                    </td>
                    <td>{new Date(s.date + "T00:00:00").toLocaleDateString()}</td>
                    <td>{s.timeStart} - {s.timeEnd}</td>
                    <td>{s.currentOrders}/{s.maxOrders}</td>
                    <td className="flex gap-1">
                      <Link href={`/admin/schedules/${s.id}`} className="btn btn-ghost btn-xs">Edit</Link>
                      {s.currentOrders === 0 && (
                        <button onClick={() => handleDelete(s.id)} className="btn btn-ghost btn-xs text-error">Delete</button>
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
