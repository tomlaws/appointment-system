"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserWithRole } from "better-auth/plugins";

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  // Get initial values from URL params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const searchField = (searchParams.get('searchField') as "name" | "email") || 'name';

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete('page');
    } else {
      params.set('page', newPage.toString());
    }
    router.push(`?${params.toString()}`);
  };

  const updateFilters = (newSearch?: string, newSearchField?: "name" | "email") => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update search
    if (newSearch !== undefined) {
      if (newSearch) {
        params.set('search', newSearch);
      } else {
        params.delete('search');
      }
    }
    
    // Update searchField
    if (newSearchField !== undefined) {
      if (newSearchField !== 'name') {
        params.set('searchField', newSearchField);
      } else {
        params.delete('searchField');
      }
    }
    
    // Reset page to 1 when filters change
    params.delete('page');
    
    router.push(`?${params.toString()}`);
  };

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
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
        <select
          value={searchField}
          onChange={e => updateFilters('', e.target.value as "name" | "email")}
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="name">Name</option>
          <option value="email">Email</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${searchField}...`}
          value={search}
          onChange={e => updateFilters(e.target.value, undefined)}
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:flex-1"
        />
        <button
          onClick={() => updateFilters('', 'name')}
          className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center min-w-[44px] h-10 self-start sm:self-auto"
          title="Clear Filters"
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-100">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-blue-900">No users found.</td></tr>
            ) : (
              users.map((user: any) => (
                <tr
                  key={user.id}
                  className="hover:bg-blue-50 transition cursor-pointer"
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => updatePage(page - 1)}
          disabled={page === 1}
          className="w-10 h-10 rounded-full border border-blue-200 bg-white text-blue-900 font-medium disabled:opacity-50 flex items-center justify-center hover:bg-blue-50 transition"
        ><ChevronLeft size={16} /></button>
        <span className="text-blue-900 mx-4">Page {page} of {totalPages || 1}</span>
        <button
          onClick={() => updatePage(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="w-10 h-10 rounded-full border border-blue-200 bg-white text-blue-900 font-medium disabled:opacity-50 flex items-center justify-center hover:bg-blue-50 transition"
        ><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
