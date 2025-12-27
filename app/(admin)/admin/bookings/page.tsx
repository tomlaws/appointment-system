"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Booking, User } from "@/generated/prisma/browser";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<(Booking & { user: User })[]>([]);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<"name" | "email">("name");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(new Set());
  const [confirmCancel, setConfirmCancel] = useState<{ open: boolean; bookingId: string | null }>({ open: false, bookingId: null });
  const pageSize = 10;

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

  const handleCancel = async (bookingId: string) => {
    setCancellingBookings(prev => new Set(prev).add(bookingId));
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: 'PATCH' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Failed to cancel booking');
        return;
      }
      // Update the booking status to CANCELLED
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
    } catch (err) {
      alert('Failed to cancel booking');
    } finally {
      setCancellingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-900">Bookings</h2>
      <div className="mb-4 flex items-center gap-2">
        <select
          value={searchField}
          onChange={e => { setPage(1); setSearchField(e.target.value as "name" | "email"); }}
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="name">User Name</option>
          <option value="email">User Email</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${searchField === "name" ? "user name" : "user email"}...`}
          value={search}
          onChange={e => { setPage(1); setSearch(e.target.value); }}
          className="border border-blue-200 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={statusFilter}
          onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
          className="border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-blue-900">No bookings found.</td></tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-blue-50 transition">
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => setConfirmCancel({ open: true, bookingId: booking.id })}
                        disabled={cancellingBookings.has(booking.id)}
                        className="px-3 py-1 rounded bg-red-100 text-red-700 font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm flex items-center gap-1"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    )}
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
      <ConfirmDialog
        open={confirmCancel.open}
        onOpenChange={(open) => setConfirmCancel({ open, bookingId: open ? confirmCancel.bookingId : null })}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Booking"
        onConfirm={() => {
          if (confirmCancel.bookingId) {
            handleCancel(confirmCancel.bookingId);
          }
          setConfirmCancel({ open: false, bookingId: null });
        }}
        variant="destructive"
      />
    </div>
  );
}
