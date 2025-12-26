import type { Prisma } from "@/generated/prisma/client";
import prisma from "./prisma";

async function getBookings({
  username,
  email,
  limit,
  offset
}: {
  username: string | undefined;
  email: string | undefined;
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
      ...userFilters.length > 0 ? { user: { OR: userFilters } } : {}
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
      ...userFilters.length > 0 ? { user: { OR: userFilters } } : {}
    },
  });

  return { bookings, total };
}

export const adminApp = {
  getBookings,
};