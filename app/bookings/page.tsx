"use client";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import { useEffect, useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useRouter } from "next/navigation";
import { VCenter } from "@/components/ui/VCenter";

interface Booking {
  id: string;
  time: string;
  status: string;
}

interface BookingItemProps {
  booking: Booking;
  onCancelled: (id: string) => void;
}

function BookingItem({ booking, onCancelled }: BookingItemProps) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

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
    <li
      className="w-full min-h-[90px] p-6 bg-white border border-blue-100 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="flex-1 flex flex-col gap-1">
        <span className="font-semibold text-blue-900 text-lg">
          {new Date(booking.time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </span>
        <span className={
          booking.status === 'CONFIRMED'
            ? 'text-green-700 font-bold text-sm'
            : 'text-gray-500 font-semibold text-sm'
        }>
          {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
        </span>
      </div>
      {booking.status === 'CONFIRMED' && (
        <button
          className="px-5 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      )}
    </li>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Fetch bookings (initial or paginated)
  const fetchBookings = useCallback(async (after?: string) => {
    const url = after ? `/api/bookings?after=${after}` : "/api/bookings";
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
    fetchBookings()
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
  }, [fetchBookings]);

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
    <>
      {loading ? (
        <VCenter>
          <div className="relative w-full" style={{ minHeight: '200px' }}>
            <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">
              <span className="flex items-center gap-2"><LoadingIndicator /><span>Loading bookings...</span></span>
            </div>
          </div>
        </VCenter>
      ) : bookings.length === 0 ? (
        <div className="text-blue-900">No bookings found.</div>
      ) : (
        <div className="max-w-6xl mx-auto p-4 overflow-x-hidden font-sans w-full">
          <h1 className="text-2xl font-bold mb-4 text-blue-900">My Bookings</h1>
          <InfiniteScroll
            dataLength={bookings.length}
            next={fetchMoreBookings}
            hasMore={hasMore}
            loader={
              <div className="flex justify-center py-4">
                <LoadingIndicator />
                <span className="ml-2 text-blue-900">Loading more...</span>
              </div>
            }
            endMessage={null}
            scrollThreshold={0.95}
          >
            <ul className="space-y-3">
              {bookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={booking}
                  onCancelled={(id) => setBookings((prev) => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))}
                />
              ))}
            </ul>
          </InfiniteScroll>
        </div>
      )}
    </>
  );
}
