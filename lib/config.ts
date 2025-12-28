import { dayjs } from "./utils";

export class Config {
    static timeslotDurationMinutes = process.env.TIMESLOT_DURATION_MINUTES ? parseInt(process.env.TIMESLOT_DURATION_MINUTES) : 30;
    static timeslotCapacity = process.env.TIMESLOT_CAPACITY ? parseInt(process.env.TIMESLOT_CAPACITY) : 5;
    static get officeHours() {
        const hoursEnv = process.env.OFFICE_HOURS || "09:00-12:00,13:00-17:00";
        return hoursEnv.split(',').map(range => {
            const [startStr, endStr] = range.split('-') as [string, string];
            const [startHour, startMinute] = startStr.split(':').map(Number) as [number, number];
            const [endHour, endMinute] = endStr.split(':').map(Number) as [number, number];
            // Create dayjs objects for the specified hours in the configured timezone
            const start = dayjs().tz().hour(startHour).minute(startMinute).second(0).millisecond(0);
            const end = dayjs().tz().hour(endHour).minute(endMinute).second(0).millisecond(0);
            return { start: start.toDate(), end: end.toDate() };
        });
    }
}