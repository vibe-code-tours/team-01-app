"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { adminFetch } from "@/lib/api-client";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const result = await adminFetch(`/users/${id}`);
      if (result.success && result.data) {
        const data = result.data as UserData;
        setUser(data);
        setName(data.name);
        setRole(data.role || "user");
        setStatus(data.status || "active");
        setPhone(data.phone || "");
      }
      setLoading(false);
    }
    loadUser();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const result = await adminFetch(`/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, status, phone: phone || null }),
    });

    setSaving(false);
    if (result.success) {
      setMessage("User updated successfully");
    } else {
      setMessage(result.error || "Failed to update user");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8">User not found</div>;
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="card-body">
          <div className="text-sm text-base-content/60 mb-4">
            {user.email} &middot; Created {new Date(user.createdAt).toLocaleDateString()}
          </div>

          {message && (
            <div className={`alert ${message.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Phone</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Role</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="delivery">Delivery</option>
                <option value="admin">Admin</option>
                <option value="super-admin">Super Admin</option>
              </select>
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${saving ? "loading" : ""}`}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
