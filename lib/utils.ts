import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(process.env.NEXT_PUBLIC_TZ || process.env.TZ || 'UTC');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { dayjs };