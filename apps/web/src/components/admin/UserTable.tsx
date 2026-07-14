import Link from "next/link";
import { StatusBadge } from "./StatusBadge";

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

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-t border-gray-100">
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Email</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Role</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Phone</th>
            <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Created</th>
            <th className="w-10 px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
              <td className="px-5 py-3">
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
              </td>
              <td className="px-5 py-3">
                <span className="text-sm text-gray-500">{user.email}</span>
              </td>
              <td className="px-5 py-3">
                <StatusBadge value={user.role || "user"} variant="generic" />
              </td>
              <td className="px-5 py-3">
                <StatusBadge value={user.status || "active"} variant="generic" />
              </td>
              <td className="px-5 py-3">
                <span className="text-sm text-gray-500">{user.phone || "-"}</span>
              </td>
              <td className="px-5 py-3">
                <span className="text-xs text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </td>
              <td className="px-5 py-3">
                <Link href={`/admin/users/${user.id}`} className="text-gray-300 hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
