import { Hono } from 'hono';
import { handle } from 'hono/vercel'
import { AppError } from '../../../lib/error';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator'
import { getUserByEmail, createBooking, getCalendar, getEmailByOneTimeCode, getTimeSlotsForDate, generateAndSendOneTimeCode } from '../../../lib/app';
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
        // Generate and send one-time code to email
        const email = c.req.valid('json').email;
        await generateAndSendOneTimeCode(email);
        return c.json({ message: 'OTP sent' });
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
        anonymous: z.object({
            token: z.string(),
            firstName: z.string(),
            lastName: z.string(),
        }).optional(),
    })),
    optionalAuthMiddleware,
    async (c) => {
        const auth = c.get('auth');
        const anonymous = c.req.valid('json').anonymous;
        if (anonymous) {
            const token = anonymous.token;
            // Parse json
            const payload = jwt.verify(token, process.env.JWT_SECRET!);
            const email = (payload as any).email;
            if (!email) {
                return c.json({ message: 'Invalid anonymous token' }, 401);
            }
            // Create anonymous user if not exists, returns existing user if already exists
            const user = await getUserByEmail(
                email,
                anonymous.firstName,
                anonymous.lastName
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