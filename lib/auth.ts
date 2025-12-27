
import { betterAuth } from "better-auth";
import { admin, emailOTP } from "better-auth/plugins"
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './prisma';
import { sendEmail } from "./resend";
import type { Hono, MiddlewareHandler } from "hono";
import { headers } from "next/headers";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        admin(),
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                console.log(`Sending ${type} OTP to ${email}: ${otp}`);
                if (type === "sign-in") {
                    // Send the OTP for sign in
                    await sendEmail(email, 'Your Sign-In Code', `Your sign-in code is: ${otp}`);
                } else if (type === "email-verification") {
                    // Send the OTP for email verification
                    await sendEmail(email, 'Your Email Verification Code', `Your email verification code is: ${otp}`);
                } else {
                    // Send the OTP for password reset
                    await sendEmail(email, 'Your Password Reset Code', `Your password reset code is: ${otp}`);
                }
            },
        })
    ]
});

export function setupHonoAuth(app: Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}>) {
    app.on(["POST", "GET"], "/auth/*", (c: any) => auth.handler(c.req.raw));
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
}

export async function getServerSession() {
    'use server';
    const headersList = await headers();
    return auth.api.getSession({
        headers: headersList,
    });
}

export const authMiddleware: MiddlewareHandler<{
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session
    }
}> = async (c, next) => {
    if (!c.get("user")) {
        return c.text('Unauthorized', 401);
    }
    await next();
};

export const adminAuthMiddleware: MiddlewareHandler<{
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session
    }
}> = async (c, next) => {
    const user = c.get("user");
    if (!user) {
        return c.text('Unauthorized', 401);
    }
    const isAdmin = user.role === 'admin';
    if (!isAdmin) {
        return c.text('Forbidden', 403);
    }
    await next();
};