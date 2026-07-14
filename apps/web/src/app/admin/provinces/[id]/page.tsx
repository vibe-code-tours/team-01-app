"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";

interface Province {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function EditProvincePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [province, setProvince] = useState<Province | null>(null);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const result = await adminFetch<Province>(`/provinces/${id}`);
      if (result.success && result.data) {
        setProvince(result.data);
        setName(result.data.name);
        setIsActive(result.data.isActive);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const result = await adminFetch(`/provinces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, isActive }),
    });

    setSaving(false);
    if (result.success) {
      setMessage("Province updated successfully");
    } else {
      setMessage(result.error || "Failed to update province");
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (!province) {
    return <div className="text-center py-8">Province not found</div>;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Province</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="card-body">
          <div className="text-sm text-gray-500 mb-4">
            Created {new Date(province.createdAt).toLocaleDateString()}
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
