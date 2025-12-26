"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UserWithRole } from "better-auth/plugins";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState("");  const [searchField, setSearchField] = useState<"name" | "email">("name");  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await authClient.admin.listUsers({
          query: {
            searchValue: search,
            searchField: searchField,
            searchOperator: "contains",
            limit: pageSize,
            offset: (page - 1) * pageSize,
            sortBy: "name",
            sortDirection: "asc",
          },
        });
        if (error) {
          console.error("Error fetching users:", error);
          setUsers([]);
          setTotal(0);
        } else {
          setUsers(data?.users || []);
          setTotal(data?.total || 0);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setUsers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [search, searchField, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Users</h2>
      <div className="mb-4 flex items-center gap-2">
        <select
          value={searchField}
          onChange={e => { setPage(1); setSearchField(e.target.value as "name" | "email"); }}
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="name">Name</option>
          <option value="email">Email</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${searchField}...`}
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value); }}
          className="border border-blue-200 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-100">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Email</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={2} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={2} className="px-6 py-4 text-center text-blue-900">No users found.</td></tr>
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="hover:bg-blue-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-900">{user.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="w-10 h-10 rounded-full border border-blue-200 bg-white text-blue-900 font-medium disabled:opacity-50 flex items-center justify-center hover:bg-blue-50 transition"
        ><ChevronLeft size={16} /></button>
        <span className="text-blue-900 mx-4">Page {page} of {totalPages || 1}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="w-10 h-10 rounded-full border border-blue-200 bg-white text-blue-900 font-medium disabled:opacity-50 flex items-center justify-center hover:bg-blue-50 transition"
        ><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
