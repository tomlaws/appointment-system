import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
    status: ContentfulStatusCode;
    code: number;

    constructor(message: string, status: ContentfulStatusCode, code: number) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

class InvalidTimeSlotError extends AppError {
    constructor() {
        super('The selected time slot is invalid', 400, 1001);
    }
}

class TimeSlotFullError extends AppError {
    constructor() {
        super('No opening for the selected time slot', 400, 1002);
    }
}

export const AppErrors = {
    InvalidTimeSlotError,
    TimeSlotFullError,
};