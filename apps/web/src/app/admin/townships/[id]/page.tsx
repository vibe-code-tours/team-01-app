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
    } else {
      setMessage(result.error || "Failed to update township");
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (!township) {
    return <div className="text-center py-8">Township not found</div>;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Township</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="card-body">
          <div className="text-sm text-gray-500 mb-4">
            {township.provinceName} &middot; Created {new Date(township.createdAt).toLocaleDateString()}
          </div>

          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Name</span></label>
              <input type="text" className="input input-bordered w-full" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Province</span></label>
              <select className="select select-bordered w-full" value={provinceId} onChange={(e) => setProvinceId(e.target.value)} required>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-control mb-6">
              <label className="label"><span className="label-text">Status</span></label>
              <select className="select select-bordered w-full" value={isActive ? "active" : "inactive"} onChange={(e) => setIsActive(e.target.value === "active")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
