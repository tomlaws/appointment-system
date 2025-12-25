import { Hono } from 'hono';
import { handle } from 'hono/vercel'
import { AppError } from '../../../lib/error';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator'
import { getUserByEmail, createBooking, getCalendar, getEmailByOneTimeCode, getTimeSlotsForDate } from '../../../lib/app';
import { optionalAuthMiddleware } from '../../../lib/auth';
import jwt from 'jsonwebtoken';

const app = new Hono().basePath('/api')
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
    '/otp/send',
    zValidator('json', z.object({
        email: z.email(),
    })),
    async (c) => {
        // In a real application, you would send an email with the one-time code here.
    });

app.post(
    '/otp/verify',
    zValidator('json', z.object({
        code: z.string(),
    })),
    async (c) => {
        const email = await getEmailByOneTimeCode(c.req.valid('json').code);
        // Sign a JWT or create a session for the user here
        const token = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '30d' });
        return c.json({ token });
    });

app.post(
    '/bookings',
    zValidator('json', z.object({
        time: z.coerce.date(),
        user: z.object({
            token: z.string(),
            firstName: z.string(),
            lastName: z.string(),
        }).optional(),
    })),
    optionalAuthMiddleware,
    async (c) => {
        const auth = c.get('auth');
        const user = c.req.valid('json').user;
        if (user) {
            const token = c.req.valid('json').user?.token;
            const email = token ? jwt.verify(token, process.env.JWT_SECRET!) as string : null;
            if (!email) {
                return c.json({ message: 'Invalid or expired token' }, 401);
            }
            // Create anonymous user if not exists, returns existing user if already exists
            const user = await getUserByEmail(
                email,
                c.req.valid('json').user?.firstName,
                c.req.valid('json').user?.lastName
            );
            const booking = await createBooking(user.id, c.req.valid('json').time);
            return c.json(booking, 201);
        } else if (auth) {
            // Authenticated user
            const { time } = c.req.valid('json');
            const booking = await createBooking(auth.id, time);
            return c.json(booking, 201);
        } else {
            // Authenticated user or one-time code must be provided
            return c.json({ message: 'User required' }, 401);
        }
    });

export const GET = handle(app)
export const POST = handle(app)
export const DELETE = handle(app)