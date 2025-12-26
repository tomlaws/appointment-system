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

class InvalidOneTimeCodeError extends AppError {
    constructor() {
        super('The provided one-time code is invalid or has already been used', 400, 1002);
    }
}

class TimeSlotFullError extends AppError {
    constructor() {
        super('No opening for the selected time slot', 400, 1003);
    }
}

class AlreadyBookedError extends AppError {
    constructor() {
        super('You have already booked this time slot', 400, 1004);
    }
}

class BookingNotFoundError extends AppError {
    constructor() {
        super('Booking not found', 404, 1005);
    }
}

class TimeSlotPassedError extends AppError {
    constructor() {
        super('The selected time slot has already passed', 400, 1006);
    }
}

export const AppErrors = {
    InvalidTimeSlotError,
    InvalidOneTimeCodeError,
    TimeSlotFullError,
    AlreadyBookedError,
    BookingNotFoundError,
    TimeSlotPassedError,
};