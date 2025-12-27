"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Booking, User } from "@/generated/prisma/browser";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<(Booking & { user: User })[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  // Get initial values from URL params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const searchField = (searchParams.get('searchField') as "name" | "email") || 'name';
  const statusFilter = searchParams.get('status') || '';

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === 1) {
      params.delete('page');
    } else {
      params.set('page', newPage.toString());
    }
    router.push(`?${params.toString()}`);
  };

  const updateFilters = (newSearch?: string, newSearchField?: "name" | "email", newStatusFilter?: string) => {
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
    
    // Update status filter
    if (newStatusFilter !== undefined) {
      if (newStatusFilter) {
        params.set('status', newStatusFilter);
      } else {
        params.delete('status');
      }
    }
    
    // Reset page to 1 when filters change
    params.delete('page');
    
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: pageSize.toString(),
          offset: ((page - 1) * pageSize).toString(),
        });
        
        if (search) {
          if (searchField === "name") {
            params.set("username", search);
          } else {
            params.set("email", search);
          }
        }

        if (statusFilter) {
          params.set("status", statusFilter);
        }

        const response = await fetch(`/api/admin/bookings?${params.toString()}`);
        const bookings = await response.json();
        const total = parseInt(response.headers.get('X-Total-Count') || '0', 10);
        setBookings(bookings || []);
        setTotal(total);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        setBookings([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [search, searchField, statusFilter, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Bookings</h2>
      <div className="mb-4 flex items-center gap-2">
        <select
          value={searchField}
          onChange={e => updateFilters(undefined, e.target.value as "name" | "email", undefined)}
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="name">User Name</option>
          <option value="email">User Email</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${searchField === "name" ? "user name" : "user email"}...`}
          value={search}
          onChange={e => updateFilters(e.target.value, undefined, undefined)}
          className="border border-blue-200 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={statusFilter}
          onChange={e => updateFilters(undefined, undefined, e.target.value)}
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          onClick={() => updateFilters('', 'name', '')}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear Filters
        </button>
      </div>
      <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-100">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">User Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">User Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Booking Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Booked At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-blue-900">No bookings found.</td></tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-blue-50 transition cursor-pointer" onClick={() => router.push(`/admin/bookings/${booking.id}`)}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-900">{booking.user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-900">{booking.user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-900">
                    {new Date(booking.time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-900">
                    {new Date(booking.createdAt).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold uppercase border ${
                      booking.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : booking.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}>
                      {booking.status}
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
