import type { Prisma } from "@/generated/prisma/client";
import prisma from "./prisma";

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

export const adminApp = {
  getBookings,
  cancelBooking,
};