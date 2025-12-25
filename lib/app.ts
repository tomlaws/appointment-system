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
    const calendarDays: { date: Date; full: boolean }[] = [];
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

        calendarDays.push({ date, full });
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
        for (let time = new Date(start); time < end; time = new Date(time.getTime() + slotDuration)) {
            const dbSlot = dbTimeSlots.find(s => s.time.getHours() === time.getHours() && s.time.getMinutes() === time.getMinutes());
            if (dbSlot) {
                timeSlots.push(dbSlot);
            } else {
                timeSlots.push({
                    id: null,
                    time,
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
        if (time >= start && time < end) {
            const totalMinutes = hour * 60 + minute;
            const startMinutes = start.getHours() * 60 + start.getMinutes();
            if ((totalMinutes - startMinutes) % slotDuration === 0) {
                return true;
            }
        }
    }
    return false;
}

export async function createBooking(userId: string, time: Date) {
    const isValidTime = await validateSlotTime(time);
    if (!isValidTime) {
        throw new AppErrors.InvalidTimeSlotError();
    }
    return prisma.$transaction(async (tx) => {
        const timeSlot = await tx.timeSlot.findUnique({
            where: { time: time },
        });
        if (timeSlot === null) {
            // Create new timeslot
            const newTimeSlot = await tx.timeSlot.create({
                data: {
                    time: time,
                    openings: Config.timeslotCapacity - 1,
                }
            });
            const booking = await tx.booking.create({
                data: {
                    userId,
                    time
                }
            });
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
                    time
                }
            });
            return booking;
        }
    });
}