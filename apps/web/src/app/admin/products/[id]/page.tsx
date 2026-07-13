"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  type: string;
  packSize: string | null;
  imageUrl: string | null;
  status: string;
  createdAt: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", type: "retail", packSize: "", imageUrl: "", status: "active" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const result = await adminFetch<Product>(`/products/${id}`);
      if (result.success && result.data) {
        const p = result.data;
        setProduct(p);
        setForm({
          name: p.name,
          description: p.description || "",
          price: p.price,
          type: p.type,
          packSize: p.packSize || "",
          imageUrl: p.imageUrl || "",
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

    const result = await adminFetch(`/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (result.success) {
      setMessage("Product updated successfully");
    } else {
      setMessage(result.error || "Failed to update product");
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (!product) {
    return <div className="text-center py-8">Product not found</div>;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-sm text-base-content/60 mb-4">
            Created {new Date(product.createdAt).toLocaleDateString()}
          </div>

          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Name</span></label>
              <input type="text" className="input input-bordered w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Price (MMK)</span></label>
              <input type="number" className="input input-bordered w-full" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Type</span></label>
              <select className="select select-bordered w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="retail">Retail</option>
                <option value="pump">Pump</option>
                <option value="bottle">Bottle</option>
              </select>
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Pack Size</span></label>
              <input type="text" className="input input-bordered w-full" value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} />
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Image URL</span></label>
              <input type="text" className="input input-bordered w-full" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div className="form-control mb-3">
              <label className="label"><span className="label-text">Description</span></label>
              <textarea className="textarea textarea-bordered w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-control mb-6">
              <label className="label"><span className="label-text">Status</span></label>
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
