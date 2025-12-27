import type { Prisma } from "@/generated/prisma/client";
import prisma from "./prisma";
import { validateSlotTime } from "./app";
import { Config } from "./config";

async function getBookings({
  username,
  email,
  status,
  limit,
  offset
}: {
  username?: string | undefined;
  email?: string | undefined;
  status?: "CONFIRMED" | "CANCELLED" | undefined;
  limit: number;
  offset: number;
}) {
  const userFilters: Prisma.UserWhereInput[] = [];
  if (username) {
    userFilters.push({
      name: {
        contains: username,
        mode: 'insensitive'
      }
    });
  }
  if (email) {
    userFilters.push({
      email: {
        contains: email,
        mode: 'insensitive'
      }
    });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      ...userFilters.length > 0 ? { user: { OR: userFilters } } : {},
      ...(status ? { status } : {}),
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });
  const total = await prisma.booking.count({
    where: {
      ...userFilters.length > 0 ? { user: { OR: userFilters } } : {},
      ...(status ? { status } : {}),
    },
  });

  return { bookings, total };
}

async function cancelBooking(bookingId: string) {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });
}

async function getTimeSlotAt(time: Date) {
  const timeSlot = await prisma.timeSlot.findUnique({
    where: { time },
  });
  if (!timeSlot) {
    const valid = validateSlotTime(time);
    if (!valid) {
      throw new Error("Invalid time slot");
    }
    // return a default time slot with Config.timeslotCapacity openings
    return {
      id: "",
      time,
      openings: Config.timeslotCapacity,
    };
  }
  return timeSlot;
}

async function getBookingsByTimeSlot(time: Date) {
  const bookings = await prisma.booking.findMany({
    where: { time: time },
    include: { user: true },
  });
  return bookings;
}

async function updateTimeSlotOpenings(time: Date, openings: number) {
  const updatedTimeSlot = await prisma.timeSlot.upsert({
    where: { time },
    update: { openings },
    create: { time, openings },
  });
  return updatedTimeSlot;
}

async function getBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true },
  });
  return booking;
}

export const adminApp = {
  getBookings,
  cancelBooking,
  getTimeSlotAt,
  getBookingsByTimeSlot,
  updateTimeSlotOpenings,
  getBooking,
};