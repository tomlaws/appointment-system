"use client";
import LoadingIndicator from "@/components/ui/LoadingIndicator";
import { useEffect, useState } from "react";

interface Booking {
  id: string;
  time: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/bookings")
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to fetch bookings");
        }
        return res.json();
      })
      .then((data) => {
        setBookings(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-900">My Bookings</h1>
      {loading ? (
        <span className="flex items-center gap-2"><LoadingIndicator /><span>Loading bookings...</span></span>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="text-blue-900">No bookings found.</div>
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id} className="p-4 bg-white border border-blue-100 rounded shadow-sm flex items-center gap-4">
              <span className="font-semibold text-blue-900">
                {new Date(booking.time).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
