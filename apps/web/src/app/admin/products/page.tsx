"use client";

import { useEffect, useState, useRef } from "react";
import { adminFetch } from "@/lib/api-client";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";

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

function getThumbnailSrc(imageUrl: string | null): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("/uploads/")) {
    const ext = imageUrl.split(".").pop() || "png";
    const base = imageUrl.replace(/\.\w+$/, "");
    return `/api${base}_thumb.${ext}`;
  }
  return imageUrl;
}

function getImageSrc(url: string | null): string {
  if (!url) return "";
  if (url.startsWith("/")) return `/api${url}`;
  return url;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", type: "retail", packSize: "", imageUrl: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  // Debounce search
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [search]);

  async function loadProducts() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);

    const result = await adminFetch<{ products: Product[]; pagination: PaginationData }>(`/products?${params}`);
    if (result.success && result.data) {
      setProducts(result.data.products);
      setPagination(result.data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  function toggleCreateForm() {
    const next = !showCreate;
    setShowCreate(next);
    if (!next) {
      setFormMsg("");
      resetForm();
    }
  }

  function resetForm() {
    setForm({ name: "", description: "", price: "", type: "retail", packSize: "", imageUrl: "" });
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
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
  }

  function getImageSrc(url: string | null): string {
    if (!url) return "";
    if (url.startsWith("/")) return `/api${url}`;
    return url;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormMsg("");

    const body: Record<string, unknown> = {
      name: form.name,
      price: Number(form.price),
      type: form.type,
    };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.packSize.trim()) body.packSize = form.packSize.trim();
    if (!imageFile && form.imageUrl.trim()) body.imageUrl = form.imageUrl.trim();

    const result = await adminFetch<{ id: string }>("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (result.success && result.data && imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      await adminFetch(`/products/${result.data.id}/image`, {
        method: "POST",
        body: formData,
      });
    }

    setCreating(false);
    if (result.success) {
      setShowCreate(false);
      setFormMsg("");
      resetForm();
      loadProducts();
    } else {
      setFormMsg(result.error || "Failed to create product");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this product?")) return;
    const result = await adminFetch(`/products/${id}`, { method: "DELETE" });
    if (result.success) {
      loadProducts();
    } else {
      alert(result.error || "Failed to delete product");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button className="btn btn-primary btn-sm" onClick={toggleCreateForm}>
          {showCreate ? "Cancel" : "+ Create Product"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="card-body">
            <h2 className="card-title">Create Product</h2>
            {formMsg && (
              <div className="alert alert-error mb-4">
                <span>{formMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                  <input type="text" className="input input-bordered w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Enter product name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price (MMK) <span className="text-red-500">*</span></label>
                  <input type="number" className="input input-bordered w-full" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.01" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type <span className="text-red-500">*</span></label>
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
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea className="textarea textarea-bordered w-full" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Enter product description" />
                </div>
              </div>
              <div>
                <button type="submit" className={`btn btn-primary w-full ${creating ? "loading" : ""}`} disabled={creating}>
                  {creating ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search products..."
            className="input input-bordered w-full max-w-xs"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="select select-bordered" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="retail">Retail</option>
            <option value="pump">Pump</option>
            <option value="bottle">Bottle</option>
          </select>
          <select className="select select-bordered" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">No products found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Pack Size</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.imageUrl ? (
                        <img src={getThumbnailSrc(p.imageUrl)} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                    </td>
                    <td className="font-medium">{p.name}</td>
                    <td>{Number(p.price).toLocaleString()} MMK</td>
                    <td><StatusBadge value={p.type} variant="generic" /></td>
                    <td>{p.packSize || "-"}</td>
                    <td><StatusBadge value={p.status} variant="product" /></td>
                    <td className="flex gap-1">
                      <a href={`/admin/products/${p.id}`} className="btn btn-ghost btn-xs">Edit</a>
                      {p.status === "active" && (
                        <button onClick={() => handleDelete(p.id)} className="btn btn-ghost btn-xs text-error">Deactivate</button>
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
