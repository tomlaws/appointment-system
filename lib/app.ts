import { UserStatus } from "../generated/prisma/enums";
import { Config } from "./config";
import { AppErrors } from "./error";
import prisma from "./prisma";
import { sendEmail } from "./resend";
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
    console.log(`Validating time slot: ${hour}:${minute}`);
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

export async function generateAndSendOneTimeCode(email: string) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    await prisma.oneTimeCode.create({
        data: {
            email,
            code,
            expiry
        }
    });
    await sendEmail(email, 'Your One-Time Code', `Your one-time code is: ${code}`);
}

export async function getEmailByOneTimeCode(code: string) {
    const otc = await prisma.oneTimeCode.updateManyAndReturn({
        where: {
            code,
            used: false,
            expiry: { gt: new Date() }
        },
        data: {
            used: true
        }
    });
    if (otc === null || otc.length === 0) {
        throw new AppErrors.InvalidOneTimeCodeError();
    }
    return otc[0]?.email;
}

export async function getUserByEmail(email: string, firstName: string, lastName: string) {
    let user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                firstName: firstName,
                lastName: lastName,
                status: UserStatus.ANONYMOUS
            }
        });
        return user;
    } else {
        return user;
    }
}

export async function createBooking(userId: string, time: Date) {
    const isValidTime = await validateSlotTime(time);
    if (!isValidTime) {
        throw new AppErrors.InvalidTimeSlotError();
    }
    // Check if user already has a booking at the same time
    const existingBooking = await prisma.booking.findUnique({
        where: {
            userId_time: {
                userId,
                time
            }
        }
    });
    if (existingBooking) {
        throw new AppErrors.AlreadyBookedError();
    }
    return prisma.$transaction(async (tx) => {
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