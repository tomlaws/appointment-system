export class Config {
    static timeslotDurationMinutes = process.env.TIMESLOT_DURATION_MINUTES ? parseInt(process.env.TIMESLOT_DURATION_MINUTES) : 30;
    static timeslotCapacity = process.env.TIMESLOT_CAPACITY ? parseInt(process.env.TIMESLOT_CAPACITY) : 5;
    static get officeHours() {
        // Example: "09:00-12:00,13:00-17:00"
        const hoursEnv = process.env.OFFICE_HOURS || "09:00-12:00,13:00-17:00";
        return hoursEnv.split(',').map(range => {
            const [startStr, endStr] = range.split('-') as [string, string];
            const [startHour, startMinute] = startStr.split(':').map(Number) as [number, number];
            const [endHour, endMinute] = endStr.split(':').map(Number) as [number, number];
            const start = new Date();
            start.setHours(startHour, startMinute, 0, 0);
            const end = new Date();
            end.setHours(endHour, endMinute, 0, 0);
            return { start, end };
        });
    }
}