"use client";

import { useEffect, useState } from "react";
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
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", type: "retail", packSize: "", imageUrl: "" });
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  async function loadProducts() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
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
  }, [page, search, typeFilter, statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormMsg("");

    const result = await adminFetch("/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setCreating(false);
    if (result.success) {
      setFormMsg("Product created successfully");
      setForm({ name: "", description: "", price: "", type: "retail", packSize: "", imageUrl: "" });
      setShowCreate(false);
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
        <h1 className="text-2xl font-bold">Products</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Create Product"}
        </button>
      </div>

      {showCreate && (
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Create Product</h2>
            {formMsg && (
              <div className={`alert ${formMsg.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
                <span>{formMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Name</span></label>
                  <input type="text" className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Price (MMK)</span></label>
                  <input type="number" className="input input-bordered" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Type</span></label>
                  <select className="select select-bordered" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="retail">Retail</option>
                    <option value="pump">Pump</option>
                    <option value="bottle">Bottle</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Pack Size</span></label>
                  <input type="text" className="input input-bordered" value={form.packSize} onChange={(e) => setForm({ ...form, packSize: e.target.value })} />
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label"><span className="label-text">Description</span></label>
                  <textarea className="textarea textarea-bordered" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <button type="submit" className={`btn btn-primary mt-4 ${creating ? "loading" : ""}`} disabled={creating}>
                {creating ? "Creating..." : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
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

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-base-content/60">No products found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
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
      )}

      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
