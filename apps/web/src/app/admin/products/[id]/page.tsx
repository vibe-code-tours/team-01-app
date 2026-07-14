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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function getImageSrc(url: string | null): string {
    if (!url) return "";
    if (url.startsWith("/")) return `/api${url}`;
    return url;
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setForm({ ...form, imageUrl: "" });
  }

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

    if (result.success && imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      await adminFetch(`/products/${id}/image`, {
        method: "POST",
        body: formData,
      });
    }

    setSaving(false);
    setImageFile(null);
    setImagePreview(null);

    if (result.success) {
      setMessage("Product updated successfully");
      // Re-fetch product to get updated imageUrl
      const refreshed = await adminFetch<Product>(`/products/${id}`);
      if (refreshed.success && refreshed.data) {
        const p = refreshed.data;
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
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="card-body">
          <div className="text-sm text-base-content/60 mb-4">
            Created {new Date(product.createdAt).toLocaleDateString()}
          </div>

          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                <input type="text" className="input input-bordered w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price (MMK) <span className="text-red-500">*</span></label>
                <input type="number" className="input input-bordered w-full" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select className="select select-bordered w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="retail">Retail</option>
                  <option value="pump">Pump</option>
                  <option value="bottle">Bottle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pack Size</label>
                <input type="text" className="input input-bordered w-full" value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} placeholder="e.g. 500ml, 1L" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
                {(imagePreview || form.imageUrl) ? (
                  <div className="relative">
                    <img src={imagePreview || getImageSrc(form.imageUrl)} alt="Product" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                    <button type="button" className="btn btn-xs btn-error absolute top-2 right-2" onClick={removeImage}>Remove</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <span className="text-sm text-gray-500">Click to upload image</span>
                    <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF (max 5MB)</span>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageSelect} />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select className="select select-bordered w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea className="textarea textarea-bordered w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Enter product description" />
              </div>
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
