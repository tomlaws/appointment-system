"use client";
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import type { TimeSlot } from '@/generated/prisma/browser';
import Link from 'next/link';

function fetchCalendar(year: number, month: number) {
  return fetch(`/api/calendar?year=${year}&month=${month}`).then(res => res.json());
}

function fetchTimeSlots(year: number, month: number, day: number) {
  return fetch(`/api/admin/timeslots?year=${year}&month=${month}&day=${day}`).then(res => res.json());
}

export default function AdminTimeSlotsPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendar, setCalendar] = useState<any | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Load calendar for current month
  useEffect(() => {
    setCalendarLoading(true);
    fetchCalendar(year, month)
      .then(setCalendar)
      .finally(() => setCalendarLoading(false));
  }, [year, month]);

  // Load timeslots when date changes
  useEffect(() => {
    if (selectedDay) {
      setSlotsLoading(true);
      fetchTimeSlots(year, month, selectedDay)
        .then(setSlots)
        .finally(() => setSlotsLoading(false));
    }
  }, [year, month, selectedDay]);

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setSelectedDate(new Date(year, month - 1, day));
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year &&
           today.getMonth() + 1 === month &&
           today.getDate() === day;
  };

  const isSelected = (day: number) => selectedDay === day;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Time Slots Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-blue-50 rounded-lg transition"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-semibold text-blue-900">
              {monthNames[month - 1]} {year}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-blue-50 rounded-lg transition"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {calendarLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingIndicator />
              <span className="ml-2 text-blue-900">Loading calendar...</span>
            </div>
          ) : calendar && calendar.days ? (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-blue-700">
                  {day}
                </div>
              ))}

              {/* Empty cells for days before the first day of the month */}
              {(() => {
                const firstDate = new Date(calendar.days[0].date);
                const firstDayOfWeek = firstDate.getDay(); // 0=Sunday
                return Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`empty-${year}-${month}-${i}`} className="p-2"></div>
                ));
              })()}

              {/* Days of the month */}
              {calendar.days.map((day: any, index: number) => {
                const dateObj = new Date(day.date);
                const dayNum = dateObj.getDate();
                const isSelected = selectedDay === dayNum;
                const isFull = Boolean(day.full);
                const isPast = Boolean(day.past);

                return (
                  <button
                    key={`day-${year}-${month}-${dayNum}`}
                    onClick={() => handleDayClick(dayNum)}
                    className={`p-2 text-center rounded-lg transition relative ${
                      isSelected
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : isToday(dayNum)
                        ? 'bg-blue-100 text-blue-900 font-semibold'
                        : isFull
                        ? 'bg-gray-100 text-gray-500'
                        : 'text-blue-900 hover:bg-blue-50'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Time Slots */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <Clock size={20} />
            Time Slots for {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>

          {slotsLoading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingIndicator />
              <span className="ml-2 text-blue-900">Loading time slots...</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-blue-700">
              No time slots available for this date.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slots.map((slot, index) => (
                <Link
                  key={`slot-${year}-${month}-${selectedDay}-${slot.id}-${index}`}
                  href={`/admin/time-slots/${encodeURIComponent(new Date(slot.time).toISOString())}`}
                  className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center hover:bg-blue-100 transition cursor-pointer block"
                >
                  <div className="font-medium text-blue-900">
                    {new Date(slot.time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    {slot.openings > 0 ? `${slot.openings} available` : 'Fully booked'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}