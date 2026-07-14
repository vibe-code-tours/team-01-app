"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api-client";
import { UserTable } from "@/components/admin/UserTable";

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string | null;
  phone: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("admin");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  async function loadUsers() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    const result = await adminFetch(`/users?${params}`);
    if (result.success && result.data) {
      const data = result.data as { users: User[]; pagination: Pagination };
      setUsers(data.users);
      setPagination(data.pagination);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, [page, search, roleFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg("");

    const result = await adminFetch("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
      }),
    });

    setCreating(false);
    if (result.success) {
      setCreateMsg("User created successfully");
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("admin");
      setShowCreate(false);
      loadUsers();
    } else {
      setCreateMsg(result.error || "Failed to create user");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="card-body">
            <h2 className="card-title">Create New User</h2>
            {createMsg && (
              <div className={`alert ${createMsg.includes("success") ? "alert-success" : "alert-error"} mb-4`}>
                <span>{createMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Name</span></label>
                  <input type="text" className="input input-bordered" value={createName} onChange={(e) => setCreateName(e.target.value)} required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Email</span></label>
                  <input type="email" className="input input-bordered" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Password</span></label>
                  <input type="password" className="input input-bordered" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} required minLength={8} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Role</span></label>
                  <select className="select select-bordered" value={createRole} onChange={(e) => setCreateRole(e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="delivery">Delivery</option>
                    <option value="user">User</option>
                  </select>
                </div>
              </div>
              <button type="submit" className={`btn btn-primary mt-4 ${creating ? "loading" : ""}`} disabled={creating}>
                {creating ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input input-bordered w-full max-w-xs"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="select select-bordered"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            <option value="super-admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="delivery">Delivery</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <UserTable users={users} />
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span className="btn btn-sm btn-ghost no-animation">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button className="btn btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
