"use client";

import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  status: string | null;
  phone: string | null;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
}

function roleBadge(role: string | null) {
  const colors: Record<string, string> = {
    "super-admin": "badge-primary",
    admin: "badge-secondary",
    delivery: "badge-accent",
    user: "badge-ghost",
  };
  return <span className={`badge ${colors[role || "user"]}`}>{role || "user"}</span>;
}

function statusBadge(status: string | null) {
  const colors: Record<string, string> = {
    active: "badge-success",
    inactive: "badge-warning",
    suspended: "badge-error",
  };
  return (
    <span className={`badge ${colors[status || "active"]}`}>
      {status || "active"}
    </span>
  );
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Phone</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="font-medium">{user.name}</td>
              <td>{user.email}</td>
              <td>{roleBadge(user.role)}</td>
              <td>{statusBadge(user.status)}</td>
              <td>{user.phone || "-"}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <Link href={`/admin/users/${user.id}`} className="btn btn-ghost btn-xs">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
