import { Config } from "./config";
import { AppErrors } from "./error";
import prisma from "./prisma";
import type { Calendar } from "./types";

export async function getCalendar(year: number, month: number): Promise<Calendar> {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    // Get timeslots from database
    const timeSlots = await prisma.timeSlot.findMany({
        where: {
            time: {
                gte: firstDayOfMonth,
                lt: new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 1)
            }
        },
        orderBy: { time: 'asc' }
    });

    // Generate all possible slot times within office hours
    const slotTimes: { hour: number, minute: number }[] = [];
    const officeHours = Config.officeHours;
    for (const { start, end } of officeHours) {
        const slotDuration = Config.timeslotDurationMinutes * 60 * 1000;
        for (let time = new Date(start); time < end; time = new Date(time.getTime() + slotDuration)) {
            slotTimes.push({ hour: time.getHours(), minute: time.getMinutes() });
        }
    }

    // Generate calendar
    const daysInMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0).getDate();
    const calendarDays: Calendar['days'] = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), day);
        const slotsForDay = timeSlots.filter(slot =>
            slot.time.getFullYear() === firstDayOfMonth.getFullYear() &&
            slot.time.getMonth() === firstDayOfMonth.getMonth() &&
            slot.time.getDate() === day
        );
        // Determine if the day is full by checking if it contains all possible slots, and each slot openings <= 0
        let full = true;
        for (const { hour, minute } of slotTimes) {
            const slot = slotsForDay.find(s => s.time.getHours() === hour && s.time.getMinutes() === minute);
            if (!slot || slot.openings > 0) {
                full = false;
                break;
            }
        }
        const past = date < new Date(new Date().setHours(0, 0, 0, 0));
        calendarDays.push({ date, full, past });
    }

    return { days: calendarDays };
}

export async function getTimeSlotsForDate(year: number, month: number, day: number) {
    const dateStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dateEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    const dbTimeSlots = await prisma.timeSlot.findMany({
        where: {
            time: {
                gte: dateStart,
                lt: dateEnd
            }
        },
        orderBy: { time: 'asc' }
    });
    const timeSlots = [];

    // Generate all possible slot times within office hours
    const officeHours = Config.officeHours;
    const slotDuration = Config.timeslotDurationMinutes * 60 * 1000;
    for (const { start, end } of officeHours) {
        // Use the correct date for each slot
        const startTime = new Date(year, month - 1, day, start.getHours(), start.getMinutes(), 0, 0);
        const endTime = new Date(year, month - 1, day, end.getHours(), end.getMinutes(), 0, 0);
        for (let time = new Date(startTime); time < endTime; time = new Date(time.getTime() + slotDuration)) {
            const dbSlot = dbTimeSlots.find(s => s.time.getHours() === time.getHours() && s.time.getMinutes() === time.getMinutes());
            if (dbSlot) {
                timeSlots.push(dbSlot);
            } else {
                const past = time < new Date();
                timeSlots.push({
                    id: null,
                    time,
                    past,
                    openings: Config.timeslotCapacity
                });
            }
        }
    }

    return timeSlots;
}

async function validateSlotTime(time: Date) {
    const hour = time.getHours();
    const minute = time.getMinutes();
    const officeHours = Config.officeHours;
    const slotDuration = Config.timeslotDurationMinutes;
    for (const { start, end } of officeHours) {
        for (let t = new Date(start); t < end; t = new Date(t.getTime() + slotDuration * 60 * 1000)) {
            if (t.getHours() === hour && t.getMinutes() === minute) {
                return true;
            }
        }
    }
    return false;
}

export async function createBooking(userId: string, time: Date) {
    // Check if it is a future time
    const now = new Date();
    if (time <= now) {
        throw new AppErrors.TimeSlotPassedError();
    }
    const isValidTime = await validateSlotTime(time);
    if (!isValidTime) {
        throw new AppErrors.InvalidTimeSlotError();
    }
    return prisma.$transaction(async (tx) => {
        // Optimistic locking: check for existing confirmed booking for this user and time
        const existing = await tx.booking.findFirst({
            where: {
                userId: userId,
                time: time,
                status: 'CONFIRMED',
            },
        });
        if (existing) {
            throw new AppErrors.AlreadyBookedError();
        }
        const timeSlot = await tx.timeSlot.findUnique({
            where: { time: time },
        });
        if (timeSlot === null) {
            // Create new timeslot
            await tx.timeSlot.create({
                data: {
                    time: time,
                    openings: Config.timeslotCapacity - 1,
                }
            });
            const booking = await tx.booking.create({
                data: {
                    userId,
                    time,
                    status: 'CONFIRMED',
                }
            });
            // Double-check for race condition (optimistic lock):
            const conflict = await tx.booking.findMany({
                where: {
                    userId: userId,
                    time: time,
                    status: 'CONFIRMED',
                },
            });
            if (conflict.length > 1) {
                throw new AppErrors.AlreadyBookedError();
            }
            return booking;
        } else {
            // Update existing timeslot
            const updated = await tx.timeSlot.updateMany({
                where: {
                    id: timeSlot.id,
                    openings: { gt: 0 }
                },
                data: {
                    openings: timeSlot.openings - 1
                }
            });
            if (updated.count === 0) {
                throw new AppErrors.TimeSlotFullError();
            }
            const booking = await tx.booking.create({
                data: {
                    userId,
                    time,
                    status: 'CONFIRMED',
                }
            });
            // Double-check for race condition (optimistic lock):
            const conflict = await tx.booking.findMany({
                where: {
                    userId: userId,
                    time: time,
                    status: 'CONFIRMED',
                },
            });
            if (conflict.length > 1) {
                throw new AppErrors.AlreadyBookedError();
            }
            return booking;
        }
    });
}

export async function getBookings(userId: string, after: string | undefined, limit: number, past: boolean = false) {
    const bookings = await prisma.booking.findMany({
        where: { 
            userId,
            time: past ? { lt: new Date() } : { gte: new Date() }
        },
        orderBy: { time: past ? 'desc' : 'asc' },
        ...after ? {
            cursor: { id: after },
            skip: 1,
        } : {},
        take: limit + 1,
    });
    const hasMore = bookings.length > limit;
    const slicedBookings = hasMore ? bookings.slice(0, limit) : bookings;
    return [slicedBookings, hasMore];
}

export async function cancelBooking(userId: string, bookingId: string) {
    return prisma.$transaction(async (tx) => {
        const bookings = await tx.booking.updateManyAndReturn({
            where: {
                id: bookingId,
                userId: userId,
                status: 'CONFIRMED'
            },
            data: { status: 'CANCELLED' }
        });
        if (!bookings || bookings.length === 0) {
            throw new AppErrors.BookingNotFoundError();
        }
        const booking = bookings[0]!;
        const timeSlot = await tx.timeSlot.findUnique({
            where: { time: booking.time }
        });
        if (timeSlot) {
            await tx.timeSlot.update({
                where: { id: timeSlot.id },
                data: {
                    openings: timeSlot.openings + 1
                }
            });
        }
    });
}