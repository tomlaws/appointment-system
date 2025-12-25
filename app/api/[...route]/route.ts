import { Hono } from 'hono';
import { handle } from 'hono/vercel'
import { AppError } from '../../../lib/error';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator'
import { getCalendar, getTimeSlotsForDate } from '../../../lib/app';

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

export const GET = handle(app)