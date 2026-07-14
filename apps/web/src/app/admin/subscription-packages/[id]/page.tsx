"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";

interface SubscriptionPackage {
  id: string;
  name: string;
  couponCount: number;
  price: string;
  description: string | null;
  expiresInDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditSubscriptionPackagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pkg, setPkg] = useState<SubscriptionPackage | null>(null);
  const [form, setForm] = useState({ name: "", couponCount: "", price: "", description: "", expiresInDays: "30", status: "active" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const result = await adminFetch<SubscriptionPackage>(`/subscription-packages/${id}`);
      if (result.success && result.data) {
        const p = result.data;
        setPkg(p);
        setForm({
          name: p.name,
          couponCount: String(p.couponCount),
          price: p.price,
          description: p.description || "",
          expiresInDays: String(p.expiresInDays || 30),
          status: p.status,
        });
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
      name: form.name,
      couponCount: Number(form.couponCount),
      price: Number(form.price),
      description: form.description.trim() || null,
      expiresInDays: Number(form.expiresInDays) || 30,
      status: form.status,
    };

    const result = await adminFetch(`/subscription-packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (result.success) {
      setMessage("Package updated successfully");
    } else {
      setMessage(result.error || "Failed to update package");
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (!pkg) {
    return <div className="text-center py-8">Package not found</div>;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Package</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="card-body">
          <div className="text-sm text-base-content/60 mb-4">
            Created {new Date(pkg.createdAt).toLocaleDateString()}
          </div>

          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
              <input type="text" className="input input-bordered w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Coupon Count <span className="text-red-500">*</span></label>
                <input type="number" className="input input-bordered w-full" value={form.couponCount} onChange={(e) => setForm({ ...form, couponCount: e.target.value })} required min="1" step="1" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (MMK) <span className="text-red-500">*</span></label>
                <input type="number" className="input input-bordered w-full" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expires In (Days)</label>
                <input type="number" className="input input-bordered w-full" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} min="1" step="1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea className="textarea textarea-bordered w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select className="select select-bordered w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button type="submit" className={`btn btn-primary w-full ${saving ? "loading" : ""}`} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
