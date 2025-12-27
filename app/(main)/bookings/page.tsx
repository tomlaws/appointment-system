"use client";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import { useEffect, useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useRouter } from "next/navigation";
import { Calendar, Clock, X } from 'lucide-react';
import { VCenter } from "@/components/ui/VCenter";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Booking {
  id: string;
  time: string;
  status: string;
}

interface BookingItemProps {
  booking: Booking;
  onCancelled: (id: string) => void;
  filter: 'future' | 'past';
}

function BookingItem({ booking, onCancelled, filter }: BookingItemProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'PATCH' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        router.push(`/error?message=${encodeURIComponent(data.message || 'Failed to cancel booking')}`);
        return;
      }
      onCancelled(booking.id);
    } catch (err: any) {
      router.push(`/error?message=${encodeURIComponent(err.message || 'Failed to cancel booking')}`);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <li
        className="w-full min-h-[90px] p-6 bg-white border border-blue-100 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex-1 flex flex-col gap-1">
          <span className="font-semibold text-blue-900 text-lg flex items-center gap-2">
            <Clock size={18} />
            {new Date(booking.time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
          </span>
          <span className={`w-fit inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase border ${booking.status === 'CONFIRMED'
            ? 'bg-green-100 text-green-700 border-green-300'
            : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}>
            {booking.status}
          </span>
        </div>
        {booking.status === 'CONFIRMED' && filter !== 'past' && (
          <button
            className="px-5 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => setConfirmCancel(true)}
            disabled={cancelling}
          >
            <X size={16} className="inline mr-1" /> Cancel
          </button>
        )}
      </li>
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel Booking"
        cancelText="Keep Booking"
        onConfirm={() => {
          handleCancel();
          setConfirmCancel(false);
        }}
        variant="destructive"
      />
    </>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'future' | 'past'>('future');

  // Fetch bookings (initial or paginated)
  const fetchBookings = useCallback(async (after?: string, filter?: 'future' | 'past') => {
    const url = after
      ? `/api/bookings?after=${after}${filter === 'past' ? '&past=true' : ''}`
      : (filter === 'past' ? '/api/bookings?past=true' : '/api/bookings');
    const res = await fetch(url);
    const hasMore = res.headers.get("X-Has-More");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to fetch bookings");
    }
    const data = await res.json();
    return { data, hasMore: hasMore === 'true' };
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchBookings(undefined, filter)
      .then(({ data, hasMore }) => {
        setBookings(data);
        setHasMore(hasMore);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  // Load more bookings for infinite scroll
  const fetchMoreBookings = async () => {
    if (!hasMore || bookings.length === 0) return;
    const lastId = bookings[bookings.length - 1]?.id;
    try {
      const { data, hasMore: more } = await fetchBookings(lastId);
      setBookings((prev) => [...prev, ...data]);
      setHasMore(more);
    } catch (err: any) {
      setError(err.message);
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-4 font-sans w-full">
      <h1 className="text-2xl font-bold mb-4 text-blue-900 flex items-center gap-2"><Calendar size={24} /> My Bookings</h1>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            if (filter !== 'future') {
              setBookings([]);
              setHasMore(true);
              setFilter('future');
            }
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'future' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Future Bookings
        </button>
        <button
          onClick={() => {
            if (filter !== 'past') {
              setBookings([]);
              setHasMore(true);
              setFilter('past');
            }
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'past' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Past Bookings
        </button>
      </div>
      <InfiniteScroll
        dataLength={bookings.length}
        next={fetchMoreBookings}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center py-4">
            <LoadingIndicator />
            <span className="ml-2 text-blue-900">{bookings.length === 0 ? 'Loading...' : 'Loading more...'}</span>
          </div>
        }
        endMessage={null}
        scrollThreshold={0.95}
      >
        <ul className="space-y-3 px-2 pb-4">
          {bookings.map((booking) => (
            <BookingItem
              key={booking.id}
              booking={booking}
              filter={filter}
              onCancelled={(id) => setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))}
            />
          ))}
        </ul>
      </InfiniteScroll>
    </div>
  );
}
