"use client";
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Clock, User, Mail, X, Hash } from 'lucide-react';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import { Button } from '@/components/ui/Button';
import type { Booking } from '@/generated/prisma/browser';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useRouter } from 'next/navigation';

type BookingWithUser = Booking & {
  user: {
    name: string | null;
    email: string;
  } | null;
};

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<BookingWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookingData();
  }, [resolvedParams.bookingId]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/bookings/${resolvedParams.bookingId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Booking not found');
        }
        throw new Error('Failed to fetch booking data');
      }
      const result: BookingWithUser = await response.json();
      setBooking(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || cancelling) return;

    try {
      setCancelling(true);
      const response = await fetch(`/api/admin/bookings/${booking.id}/cancel`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Update the booking status locally
      setBooking(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <LoadingIndicator />
          <span className="ml-2 text-blue-900">Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Booking not found'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center mt-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </button>
        </div>
      </div>
    );
  }

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
          Booking Details
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Information */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Appointment Details</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Hash size={20} className="text-blue-700" />
              <div>
                <p className="font-medium text-blue-900">Booking ID</p>
                <p className="text-sm text-slate-600 font-mono">
                  {booking.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-blue-700" />
              <div>
                <p className="font-medium text-blue-900">
                  {new Date(booking.time).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-slate-600">
                  {new Date(booking.time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-blue-700" />
              <div>
                <p className="font-medium text-blue-900">Status</p>
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${booking.status === 'CONFIRMED'
                    ? 'bg-green-100 text-green-800'
                    : booking.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {booking.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock size={20} className="text-blue-700" />
              <div>
                <p className="font-medium text-blue-900">Booked on</p>
                <p className="text-sm text-slate-600">
                  {new Date(booking.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>

          {booking.status === 'CONFIRMED' && (
            <div className="mt-6">
              <Button
                onClick={() => setShowCancelDialog(true)}
                variant="destructive"
                className="w-full"
                disabled={cancelling}
              >
                <X size={16} className="mr-2" />
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </div>
          )}
        </div>

        {/* User Information */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <User size={20} />
            Customer Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User size={20} className="text-blue-700" />
              <div>
                <p className="font-medium text-blue-900">Name</p>
                <p className="text-sm text-slate-600">
                  {booking.user?.name || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={20} className="text-blue-700" />
              <div>
                <p className="font-medium text-blue-900">Email</p>
                <p className="text-sm text-slate-600">
                  {booking.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelBooking}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText={cancelling ? "Cancelling..." : "Cancel Booking"}
        variant="destructive"
        disabled={cancelling}
      />
    </div>
  );
}