import { Hono } from 'hono';
import { handle } from 'hono/vercel'
import { AppError } from '../../../lib/error';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { createBooking, getCalendar, getTimeSlotsForDate, cancelBooking, getBookings } from '../../../lib/app';
import { adminAuthMiddleware, auth, authMiddleware, setupHonoAuth } from '../../../lib/auth';
import { adminApp } from '@/lib/admin-app';
import { BookingStatus } from '@/generated/prisma/enums';

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}>().basePath('/api')

setupHonoAuth(app);

app.onError((err, c) => {
    if (err instanceof AppError) {
        return c.json({
            message: err.message,
            code: err.code,
        }, err.status)
    }
    console.error(err);
    return c.text('Internal Server Error', 500);
});

app.use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
        c.set("user", null);
        c.set("session", null);
        await next();
        return;
    }
    c.set("user", session.user);
    c.set("session", session.session);
    await next();
});
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get(
    '/calendar',
    zValidator('query', z.object({
        year: z.coerce.number().int().min(1970).max(2100),
        month: z.coerce.number().int().min(1).max(12),
    })),
    async (c) => {
        const calendar = await getCalendar(c.req.valid('query').year, c.req.valid('query').month);
        return c.json(calendar);
    });

app.get(
    '/timeslots',
    zValidator('query', z.object({
        year: z.coerce.number().int().min(1970).max(2100),
        month: z.coerce.number().int().min(1).max(12),
        day: z.coerce.number().int().min(1).max(31),
    })),
    async (c) => {
        const { year, month, day } = c.req.valid('query');
        const slots = await getTimeSlotsForDate(year, month, day);
        return c.json(slots);
    });

app.post(
    '/bookings',
    authMiddleware,
    zValidator('json', z.object({
        time: z.coerce.date()
    })),
    async (c) => {
        const user = c.get('user');
        // Authenticated user
        const { time } = c.req.valid('json');
        const booking = await createBooking(user.id, time);
        return c.json(booking, 201);
    });

app.patch(
    '/bookings/:id/cancel',
    authMiddleware,
    zValidator('param', z.object({
        id: z.uuid(),
    })),
    async (c) => {
        const user = c.get('user');
        const bookingId = c.req.param('id');
        // Update booking status to CANCELLED
        await cancelBooking(user.id, bookingId);
        return c.json({ message: 'Booking cancelled' });
    }
);

app.get(
    '/bookings',
    zValidator('query', z.object({
        after: z.uuid().optional(),
        past: z.coerce.boolean().optional(),
    })),
    authMiddleware,
    async (c) => {
        const user = c.get('user');
        const after = c.req.query('after');
        const past = c.req.query('past') === 'true';
        const limit = 20;
        const [bookings, hasMore] = await getBookings(user.id, after, limit, past);
        c.res.headers.set('X-Limit', limit.toString());
        c.res.headers.set('X-Has-More', hasMore ? 'true' : 'false');
        return c.json(bookings);
    });

// Admin routes
app.use('/admin/*', adminAuthMiddleware);

app.get('/admin/bookings',
    zValidator('query', z.object({
        username: z.string().optional(),
        email: z.string().optional(),
        status: z.enum(BookingStatus).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(10),
        offset: z.coerce.number().int().min(0).default(0),
    })),
    async (c) => {
        const { bookings, total } = await adminApp.getBookings({
            username: c.req.valid('query').username,
            email: c.req.valid('query').email,
            status: c.req.valid('query').status,
            limit: c.req.valid('query').limit,
            offset: c.req.valid('query').offset,
        });
        c.res.headers.set('X-Total-Count', total.toString());
        return c.json(bookings);
    });

app.patch('/admin/bookings/:id/cancel',
    zValidator('param', z.object({
        id: z.uuid(),
    })),
    async (c) => {
        const bookingId = c.req.valid('param').id;
        await adminApp.cancelBooking(bookingId);
        return c.json({ message: 'Booking cancelled' });
    });

app.get('/admin/timeslots',
    zValidator('query', z.object({
        year: z.coerce.number().int().min(1970).max(2100),
        month: z.coerce.number().int().min(1).max(12),
        day: z.coerce.number().int().min(1).max(31),
    })),
    async (c) => {
        const { year, month, day } = c.req.valid('query');
        const slots = await getTimeSlotsForDate(year, month, day);
        return c.json(slots);
    });

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)