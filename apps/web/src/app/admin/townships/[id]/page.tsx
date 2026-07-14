"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";

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

export default function EditTownshipPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [township, setTownship] = useState<Township | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [name, setName] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSuccess, setMessageSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const [tResult, pResult] = await Promise.all([
        adminFetch<Township>(`/townships/${id}`),
        adminFetch<{ provinces: Province[] }>("/provinces?limit=100"),
      ]);
      if (tResult.success && tResult.data) {
        setTownship(tResult.data);
        setName(tResult.data.name);
        setProvinceId(tResult.data.provinceId);
        setIsActive(tResult.data.isActive);
      }
      if (pResult.success && pResult.data) {
        setProvinces(pResult.data.provinces);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const result = await adminFetch(`/townships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, provinceId, isActive }),
    });

    setSaving(false);
    if (result.success) {
      setMessage("Township updated successfully");
      setMessageSuccess(true);
    } else {
      setMessage(result.error || "Failed to update township");
      setMessageSuccess(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  if (!township) {
    return <div className="text-center py-16"><p className="text-sm text-gray-500">Township not found</p></div>;
  }

  return (
    <div className="max-w-lg animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => router.back()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Township</h1>
          <p className="text-sm text-gray-500 mt-0.5">{township.provinceName} &middot; Created {new Date(township.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={provinceId} onChange={(e) => setProvinceId(e.target.value)} required>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={isActive ? "active" : "inactive"} onChange={(e) => setIsActive(e.target.value === "active")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
