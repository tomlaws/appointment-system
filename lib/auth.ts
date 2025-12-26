
import { betterAuth } from "better-auth";
import { emailOTP, magicLink } from "better-auth/plugins"
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './prisma';
import { sendEmail } from "./resend";
import type { Hono, MiddlewareHandler } from "hono";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }), 
    plugins: [
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

// import type { MiddlewareHandler } from 'hono';
// import type { DecodedIdToken } from 'firebase-admin/auth';

// // Verify bearer token and attach decoded token to context
// export async function getAuth(req: any): Promise<admin.auth.DecodedIdToken | null> {
//     const authHeader = (req.get && req.get('Authorization')) || req.headers?.authorization || req.headers?.Authorization;
//     if (!authHeader) return null;
//     const m = String(authHeader).match(/^Bearer\s+(.+)$/i);
//     if (!m) return null;
//     const token = m[1];
//     if (!token) return null;
//     try {
//         const decoded = await admin.auth().verifyIdToken(token);
//         return decoded;
//     } catch (e) {
//         console.error('Error verifying auth token:', e);
//         return null;
//     }
// }

// export const authMiddleware: MiddlewareHandler<{
//     Variables: {
//         auth: DecodedIdToken
//     }
// }> = async (c, next) => {
//     const auth = await getAuth(c.req);
//     if (!auth) return c.text('Unauthorized', 401);
//     c.set('auth', auth);
//     return await next();
// };

// export const optionalAuthMiddleware: MiddlewareHandler<{
//     Variables: {
//         auth: DecodedIdToken | null
//     }
// }> = async (c, next) => {
//     const auth = await getAuth(c.req);
//     c.set('auth', auth);
//     return await next();
// };

// export const adminAuthMiddleware: MiddlewareHandler<{
//     Variables: {
//         auth: DecodedIdToken
//     }
// }> = async (c, next) => {
//     const auth = await getAuth(c.req);
//     if (!auth) return c.text('Unauthorized', 401);
//     if (auth.role) {
//         // Check if role claim is expired
//         const nowInSeconds = Math.floor(Date.now() / 1000);
//         if (auth.role.exp && auth.role.exp > nowInSeconds) {
//             auth.role = null;
//         }
//     }
//     // If no role claim, fetch from firestore
//     if (!auth.role) {
//         // Retrieve from firestore
//         const userDoc = await admin.firestore().collection('users').doc(auth.uid).get();
//         const userData = userDoc.data();
//         if (userData?.role) {
//             const fifteenMinutes = 15 * 60 * 1000;
//             // add fifteen minutes to current time
//             const expirationTime = Date.now() + fifteenMinutes;
//             const claims = {
//                 role: {
//                     ...userData.role,
//                     exp: Math.floor(expirationTime / 1000)
//                 }
//             };
//             await admin.auth().setCustomUserClaims(auth.uid, claims);
//             auth.role = userData.role;
//         } else {
//             return c.text('Forbidden', 403);
//         }
//     }
//     // Check if admin
//     if (auth.role !== 'admin') {
//         return c.text('Forbidden', 403);
//     }
//     c.set('auth', auth);
//     return await next();
// }