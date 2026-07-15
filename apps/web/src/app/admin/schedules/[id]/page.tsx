"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";

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
  townships: { id: string; name: string }[];
}

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [townships, setTownships] = useState<Township[]>([]);
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [maxOrders, setMaxOrders] = useState("");
  const [isProvinceWide, setIsProvinceWide] = useState(true);
  const [townshipIds, setTownshipIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await adminFetch<Schedule>(`/schedules/${id}`);
      if (result.success && result.data) {
        const s = result.data;
        setSchedule(s);
        setDate(s.date.split("T")[0]);
        setTimeStart(s.timeStart);
        setTimeEnd(s.timeEnd);
        setMaxOrders(String(s.maxOrders));
        setIsProvinceWide(s.isProvinceWide);
        setTownshipIds(s.townships.map((t) => t.id));

        const tResult = await adminFetch<Township[]>(`/townships-by-province/${s.provinceId}`);
        if (tResult.success && tResult.data) setTownships(tResult.data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const body: Record<string, unknown> = {
      date,
      timeStart,
      timeEnd,
      maxOrders: Number(maxOrders),
      isProvinceWide,
    };
    if (!isProvinceWide) {
      body.townshipIds = townshipIds;
    }

    const result = await adminFetch(`/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (result.success) {
      setMessage("Schedule updated successfully");
      setMessageSuccess(true);
    } else {
      setMessage(result.error || "Failed to update schedule");
      setMessageSuccess(false);
    }
  }

  function toggleTownship(tid: string) {
    setTownshipIds((prev) => prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid]);
  }

  function selectAllTownships() {
    setTownshipIds(townships.map((t) => t.id));
  }

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  if (!schedule) {
    return <div className="text-center py-16"><p className="text-sm text-gray-500">Schedule not found</p></div>;
  }

  return (
    <div className="max-w-lg animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => router.back()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">{schedule.provinceName} &middot; Orders: {schedule.currentOrders}/{schedule.maxOrders}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium mb-5 ${messageSuccess ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
              <input type="text" className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500" value={schedule.provinceName || ""} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Start</label>
                <input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Time End</label>
                <input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Orders</label>
              <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-gray-100" value={maxOrders} onChange={(e) => setMaxOrders(e.target.value)} min="1" disabled={schedule.currentOrders > 0} required />
              {schedule.currentOrders > 0 && <p className="text-xs text-gray-400 mt-1">Cannot change capacity with existing orders</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={isProvinceWide ? "true" : "false"} onChange={(e) => setIsProvinceWide(e.target.value === "true")}>
                <option value="true">Province Wide</option>
                <option value="false">Specific Townships</option>
              </select>
            </div>

            {!isProvinceWide && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Townships</label>
                {townships.length === 0 ? (
                  <p className="text-sm text-gray-400">No active townships.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                    <button type="button" className="text-xs font-medium text-primary hover:underline mb-2" onClick={selectAllTownships}>Select All</button>
                    {townships.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer py-1">
                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={townshipIds.includes(t.id)} onChange={() => toggleTownship(t.id)} />
                        <span className="text-sm text-gray-700">{t.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button type="submit" className="mt-6 btn btn-primary btn-sm" disabled={saving}>
            {saving && <span className="loading loading-spinner loading-sm"></span>}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
