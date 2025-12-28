"use client";
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Users, Save } from 'lucide-react';
import Link from 'next/link';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import { Button } from '@/components/ui/Button';
import type { TimeSlot, Booking } from '@/generated/prisma/browser';
import { useRouter } from 'next/navigation';
import { dayjs } from '@/lib/utils';

type BookingWithUser = Booking & {
  user: {
    name: string | null;
    email: string;
  } | null;
};

interface TimeSlotData {
  timeslot: TimeSlot;
  bookings: BookingWithUser[];
}

export default function AdminTimeSlotDetailPage({
  params,
}: {
  params: Promise<{ time: string }>;
}) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [data, setData] = useState<TimeSlotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openings, setOpenings] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const time = dayjs.utc(decodeURIComponent(resolvedParams.time));

  useEffect(() => {
    fetchTimeSlotData();
  }, [resolvedParams.time]);

  const fetchTimeSlotData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/timeslots/${encodeURIComponent(time.toISOString())}`);
      if (!response.ok) {
        throw new Error('Failed to fetch time slot data');
      }
      const result: TimeSlotData = await response.json();
      setData(result);
      setOpenings(result.timeslot.openings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOpenings = async () => {
    if (!data) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/timeslots/${encodeURIComponent(time.toISOString())}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ openings }),
      });

      if (!response.ok) {
        throw new Error('Failed to update openings');
      }

      const updatedTimeslot = await response.json();
      setData(prev => prev ? { ...prev, timeslot: updatedTimeslot } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update openings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center items-center py-12">
          <LoadingIndicator />
          <span className="ml-2 text-blue-900">Loading time slot details...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Time slot not found'}</p>
          <Link
            href="/admin/time-slots"
            className="inline-flex items-center mt-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-md transition-colors border border-slate-300 cursor-pointer"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Link>
        </div>
      </div>
    );
  }

  const { timeslot, bookings } = data;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-md transition-colors border border-slate-300 cursor-pointer mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-blue-900">
          Time Slot Details
        </h1>
        <p className="text-blue-700 mt-1">
          {time.format('dddd, MMMM D, YYYY [at] h:mm A')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Slot Settings */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Slot Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Available Openings
              </label>
              <input
                type="number"
                min="0"
                value={openings}
                onChange={(e) => setOpenings(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <Button
              onClick={handleSaveOpenings}
              disabled={saving || openings === timeslot.openings}
              className="w-full"
            >
              {saving ? (
                <>
                  <LoadingIndicator size="sm" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-900">
              <Users size={16} />
              <span className="font-medium">
                {bookings.length} / {timeslot.openings + bookings.length} booked
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {timeslot.openings > 0 ? `${timeslot.openings} spots remaining` : 'Fully booked'}
            </p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <Users size={20} />
            Bookings ({bookings.length})
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-8 text-blue-700">
              No bookings for this time slot.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block p-4 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-blue-900">
                        {booking.user?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-blue-700">
                        {booking.user?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Booked on {dayjs(booking.createdAt).format('MMM D, YYYY')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}