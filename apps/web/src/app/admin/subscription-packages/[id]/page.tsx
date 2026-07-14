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
  const [messageSuccess, setMessageSuccess] = useState(false);

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
      setMessageSuccess(true);
    } else {
      setMessage(result.error || "Failed to update package");
      setMessageSuccess(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  if (!pkg) {
    return <div className="text-center py-16"><p className="text-sm text-gray-500">Package not found</p></div>;
  }

  return (
    <div className="max-w-lg animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" onClick={() => router.back()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Package</h1>
          <p className="text-sm text-gray-500 mt-0.5">Created {new Date(pkg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Coupon Count <span className="text-red-500">*</span></label>
                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={form.couponCount} onChange={(e) => setForm({ ...form, couponCount: e.target.value })} required min="1" step="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (MMK) <span className="text-red-500">*</span></label>
                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expires In (Days)</label>
                <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} min="1" step="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Package description" />
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
