"use client";
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import type { TimeSlot } from '../../generated/prisma/browser';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { VCenter } from '@/components/ui/VCenter';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

function fetchCalendar(year: number, month: number, signal: AbortSignal) {
  return fetch(`/api/calendar?year=${year}&month=${month}`, { signal }).then(res => res.json());
}

function fetchTimeSlots(year: number, month: number, day: number) {
  return fetch(`/api/timeslots?year=${year}&month=${month}&day=${day}`).then(res => res.json());
}

function createBooking(time: Date) {
  return fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time })
  }).then(async res => {
    const data = await res.json();
    return { status: res.status, data };
  });
}

export default function AppointmentSystem() {
  const today = new Date();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [calendar, setCalendar] = useState<any | null>(null);
  const [slots, setSlots] = useState<(TimeSlot & { past: boolean })[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedTime, setSelectedTimeRaw] = useState<Date | null>(null);
  const setSelectedTime = (time: Date | null) => {
    setSelectedTimeRaw(time);
    if (time !== null) {
      setBookingResult(null);
      setBookingError(null); // Clear error when selecting a timeslot
    }
  };
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [bookingResult, setBookingResult] = useState<{ time?: string | Date } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setCalendarLoading(true);

    fetchCalendar(year, month, signal)
      .then((data) => {
        // Only update if this response is for the current year/month
        if (!signal.aborted) {
          setCalendar(data);
        }
      })
      .catch((error) => {
        if (!signal.aborted) {
          console.error('Failed to fetch calendar:', error);
          setCalendar(null);
        }
      })
      .finally(() => {
        if (!signal.aborted) {
          setCalendarLoading(false);
        }
      });

    // Cleanup function to abort on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [year, month]);


  // Layout will be handled with responsive CSS classes in globals.css

  useEffect(() => {
    if (selectedDay !== null) {
      setSlotsLoading(true);
      fetchTimeSlots(year, month, selectedDay)
        .then((data) => setSlots(data))
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false));
    } else {
      setSlots([]);
    }
  }, [year, month, selectedDay]);


  const handleBook = async () => {
    if (!selectedTime) return;
    if (!session?.user) {
      router.push('/login');
      return;
    }
    setBookingLoading(true);
    setBookingError(null);
    try {
      const result = await createBooking(selectedTime);
      if (result.status === 201) {
        setBookingResult(result.data);
        setBookingError(null);
      } else {
        setBookingResult(null);
        setBookingError(result.data?.message || 'Booking failed.');
      }
      setSelectedTime(null); // Deselect timeslot after booking
      if (selectedDay !== null) {
        fetchTimeSlots(year, month, selectedDay).then(setSlots);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Calendar grid helpers
  function getCalendarMatrix() {
    if (!calendar) return [];
    const days = calendar.days;
    const firstDate = new Date(days[0].date);
    const firstDayOfWeek = firstDate.getDay(); // 0=Sunday
    const matrix = [];
    let week = [];
    // Fill leading blanks
    for (let i = 0; i < firstDayOfWeek; i++) week.push(null);
    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      if (week.length === 7) {
        matrix.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      matrix.push(week);
    }
    return matrix;
  }

  return (
    <VCenter>
      <div className="max-w-[1200px] mx-auto p-2 sm:p-5 overflow-x-hidden font-sans w-full">
        <div className="flex flex-col md:flex-row gap-5 items-start w-full">
          <div className="flex-1 w-full">
            <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-2 sm:p-6 w-full flex flex-col h-[540px]">
              <div className="flex items-center justify-between h-[48px] mb-4">
                <div className="w-12 flex justify-start items-center h-full">
                  <button
                    aria-label="Previous month"
                    disabled={calendarLoading || (month === today.getMonth() + 1 && year === today.getFullYear())}
                    onClick={() => {
                      let newMonth, newYear;
                      if (month === 1) {
                        newMonth = 12;
                        newYear = year - 1;
                      } else {
                        newMonth = month - 1;
                        newYear = year;
                      }
                      setMonth(newMonth);
                      setYear(newYear);
                      if (newMonth === today.getMonth() + 1 && newYear === today.getFullYear()) {
                        setSelectedDay(today.getDate());
                      } else {
                        setSelectedDay(1);
                      }
                    }}
                    className={`border border-blue-100 bg-white p-2 rounded-lg transition-colors hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 ${month === today.getMonth() + 1 && year === today.getFullYear() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  ><ChevronLeft size={16} /></button>
                </div>
                <div className="flex-1 flex items-center justify-center h-full">
                  <span className="text-center font-bold text-blue-900 text-base">
                    {new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })} {year}
                  </span>
                </div>
                <div className="w-12 flex justify-end items-center h-full">
                  <button
                    aria-label="Next month"
                    disabled={calendarLoading}
                    onClick={() => {
                      let newMonth, newYear;
                      if (month === 12) {
                        newMonth = 1;
                        newYear = year + 1;
                      } else {
                        newMonth = month + 1;
                        newYear = year;
                      }
                      setMonth(newMonth);
                      setYear(newYear);
                      if (newMonth === today.getMonth() + 1 && newYear === today.getFullYear()) {
                        setSelectedDay(today.getDate());
                      } else {
                        setSelectedDay(1);
                      }
                    }}
                    className="border border-blue-100 bg-white p-2 rounded-lg cursor-pointer transition-colors hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                  ><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 text-blue-900 font-bold text-xs text-center">
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>
              <div className="flex flex-col gap-2 mt-3 flex-1 min-h-[288px]">
                {calendarLoading || !calendar ? (
                  <div key="loading" className="flex-1 flex flex-col justify-center items-center">
                    <div className="flex items-center gap-2">
                      <LoadingIndicator />
                      <span>Loading calendar...</span>
                    </div>
                  </div>
                ) : getCalendarMatrix().map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-1 gap-2">
                    {week.map((d, idx) => {
                      if (!d) return <div key={idx} className="flex-1" />;
                      const dateObj = new Date(d.date);
                      const dayNum = dateObj.getDate();
                      const isSelected = selectedDay === dayNum;
                      const isFull = Boolean(d.full);
                      const isPast = Boolean(d.past);
                      const disabled = isPast;
                      return (
                        <div key={idx} className="flex-1 flex items-stretch">
                          <button
                            type="button"
                            className={[
                              'w-full h-full p-3 rounded-lg cursor-pointer border box-border transition-colors flex flex-col items-center justify-center relative',
                              isFull && !isPast ? 'bg-gray-100 text-gray-500 border-gray-300' : 'bg-white border-blue-100',
                              isSelected ? '!bg-blue-200 !border-blue-400 !text-blue-900' : '',
                              isPast ? 'opacity-50 pointer-events-none cursor-not-allowed' : '',
                            ].join(' ')}
                            onClick={() => {
                              if (!disabled) {
                                setSelectedDay(dayNum);
                                setSelectedTime(null);
                              }
                            }}
                            tabIndex={disabled ? -1 : 0}
                            disabled={disabled}
                          >
                            <span className={["font-bold text-sm z-10", isSelected && isFull && !isPast ? "text-blue-900" : ""].join(" ")}>{dayNum}</span>
                            {isFull && !isPast && (
                              <span className={[
                                "mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold pointer-events-none select-none border",
                                isSelected && isFull && !isPast
                                  ? "bg-blue-100 text-blue-700 border-blue-300"
                                  : "bg-gray-200 text-gray-600 border-gray-200"
                              ].join(" ")} style={{ lineHeight: 1 }}>Full</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col w-full lg:flex-[0_0_360px] lg:w-[360px]">
            {selectedDay !== null && (
              <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-2 sm:p-6 w-full flex flex-col h-[540px]">
                <div className="flex items-center justify-center h-[48px] mb-4">
                  <span className="text-blue-900 font-semibold text-base flex items-center h-full justify-center">
                    {selectedDay !== null
                      ? `Timeslots available on ${new Date(year, month - 1, selectedDay).toLocaleString('en-US', { month: 'short', day: 'numeric' })}`
                      : ''}
                  </span>
                </div>
                <div className="relative flex-1 min-h-0 overflow-y-auto">
                  {slotsLoading ? (
                    <div className="absolute inset-0 flex justify-center items-center z-10">
                      <span className="flex items-center gap-2"><LoadingIndicator /><span>Loading time slots...</span></span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="absolute inset-0 flex justify-center items-center z-10">
                      <span className="flex items-center gap-2">
                        <div className="text-blue-900">No slots available</div>
                      </span>
                    </div>
                  ) : (
                    slots.filter(slot => !slot.past).map((slot, i) => {
                      const isSelected = selectedTime && new Date(selectedTime).getTime() === new Date(slot.time).getTime();
                      return (
                        <div
                          key={i}
                          className={[
                            'flex items-center p-3 rounded-lg mb-2 cursor-pointer transition-colors',
                            [
                              slot.openings > 0
                                ? 'bg-white border border-gray-300 hover:bg-gray-100 transition-colors'
                                : 'bg-gray-50 border border-gray-200',
                              slot.openings === 0 ? 'opacity-60 pointer-events-none' : '',
                              isSelected ? '!bg-blue-200 !border-blue-400 !text-blue-900' : '',
                            ].filter(Boolean).join(' '),
                          ].join(' ')}
                          onClick={() => slot.openings > 0 && setSelectedTime(slot.time)}
                        >
                          <div className="flex-1">
                            <div className="font-bold">{new Date(slot.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-xs text-blue-900">{slot.openings} opening{slot.openings !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {selectedTime && (
                  <div className="mt-4 p-3 lg:p-4 bg-white border-2 border-blue-300 rounded-xl flex items-center gap-2 lg:gap-4 shadow-sm">
                    <div className="flex items-center justify-center w-8 h-8 lg:w-12 lg:h-12 bg-blue-100 rounded-full">
                      <Check className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-sm font-semibold text-blue-900">
                        {new Date(selectedTime).toLocaleDateString('en-US')}
                      </span>
                      <span className="text-xs text-blue-900 mt-0.5">
                        {new Date(selectedTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <Button onClick={handleBook} disabled={bookingLoading}>
                        {bookingLoading && (
                          <span className="pr-2"><LoadingIndicator size="sm" /></span>
                        )}
                        <span>Book</span>
                      </Button>
                    </div>
                  </div>
                )}
                {bookingResult && !bookingError && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex flex-col items-center animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-7 h-7 text-green-500 animate-bounce-in" />
                      <span className="text-md font-bold text-green-700">Booking Confirmed!</span>
                    </div>
                    <div className="text-green-900 text-sm text-center">
                      Your appointment is booked for <br />
                      <span className="font-semibold">{bookingResult.time ? new Date(bookingResult.time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
                    </div>
                  </div>
                )}
                {bookingError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="w-7 h-7 text-red-500 animate-bounce-in" />
                      <span className="text-md font-bold text-red-700">Booking Failed</span>
                    </div>
                    <div className="text-red-900 text-sm text-center">
                      {bookingError}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </VCenter>
  );
}
