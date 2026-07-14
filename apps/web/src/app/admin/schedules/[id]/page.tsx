"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";

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
    } else {
      setMessage(result.error || "Failed to update schedule");
    }
  }

  function toggleTownship(tid: string) {
    setTownshipIds((prev) => prev.includes(tid) ? prev.filter((x) => x !== tid) : [...prev, tid]);
  }

  function selectAllTownships() {
    setTownshipIds(townships.map((t) => t.id));
  }

  if (loading) {
    return <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (!schedule) {
    return <div className="text-center py-8">Schedule not found</div>;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Schedule</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="card-body">
          <div className="text-sm text-gray-500 mb-4">
            {schedule.provinceName} &middot; Orders: {schedule.currentOrders}/{schedule.maxOrders}
          </div>

          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Province</span></label>
              <input type="text" className="input input-bordered w-full" value={schedule.provinceName || ""} disabled />
            </div>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Date</span></label>
              <input type="date" className="input input-bordered w-full" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Time Start</span></label>
                <input type="time" className="input input-bordered w-full" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} required />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Time End</span></label>
                <input type="time" className="input input-bordered w-full" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} required />
              </div>
            </div>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Max Orders</span></label>
              <input type="number" className="input input-bordered w-full" value={maxOrders} onChange={(e) => setMaxOrders(e.target.value)} min="1" disabled={schedule.currentOrders > 0} required />
              {schedule.currentOrders > 0 && <span className="text-xs text-gray-500 mt-1">Cannot change capacity with existing orders</span>}
            </div>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Type</span></label>
              <select className="select select-bordered w-full" value={isProvinceWide ? "true" : "false"} onChange={(e) => setIsProvinceWide(e.target.value === "true")}>
                <option value="true">Province Wide</option>
                <option value="false">Specific Townships</option>
              </select>
            </div>

            {!isProvinceWide && (
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Townships</span></label>
                {townships.length === 0 ? (
                  <p className="text-sm text-gray-500">No active townships.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <button type="button" className="btn btn-ghost btn-xs mb-2" onClick={selectAllTownships}>Select All</button>
                    {townships.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer py-1">
                        <input type="checkbox" className="checkbox checkbox-sm" checked={townshipIds.includes(t.id)} onChange={() => toggleTownship(t.id)} />
                        <span className="text-sm">{t.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
