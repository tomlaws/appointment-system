import type { MiddlewareHandler } from 'hono';
import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Verify bearer token and attach decoded token to context
export async function getAuth(req: any): Promise<admin.auth.DecodedIdToken | null> {
    const authHeader = (req.get && req.get('Authorization')) || req.headers?.authorization || req.headers?.Authorization;
    if (!authHeader) return null;
    const m = String(authHeader).match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const token = m[1];
    if (!token) return null;
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        return decoded;
    } catch (e) {
        console.error('Error verifying auth token:', e);
        return null;
    }
}

export const authMiddleware: MiddlewareHandler<{
    Variables: {
        auth: DecodedIdToken
    }
}> = async (c, next) => {
    const auth = await getAuth(c.req);
    if (!auth) return c.text('Unauthorized', 401);
    c.set('auth', auth);
    return await next();
};

export const optionalAuthMiddleware: MiddlewareHandler<{
    Variables: {
        auth: DecodedIdToken | null
    }
}> = async (c, next) => {
    const auth = await getAuth(c.req);
    c.set('auth', auth);
    return await next();
};

export const adminAuthMiddleware: MiddlewareHandler<{
    Variables: {
        auth: DecodedIdToken
    }
}> = async (c, next) => {
    const auth = await getAuth(c.req);
    if (!auth) return c.text('Unauthorized', 401);
    if (auth.role) {
        // Check if role claim is expired
        const nowInSeconds = Math.floor(Date.now() / 1000);
        if (auth.role.exp && auth.role.exp > nowInSeconds) {
            auth.role = null;
        }
    }
    // If no role claim, fetch from firestore
    if (!auth.role) {
        // Retrieve from firestore
        const userDoc = await admin.firestore().collection('users').doc(auth.uid).get();
        const userData = userDoc.data();
        if (userData?.role) {
            const fifteenMinutes = 15 * 60 * 1000;
            // add fifteen minutes to current time
            const expirationTime = Date.now() + fifteenMinutes;
            const claims = {
                role: {
                    ...userData.role,
                    exp: Math.floor(expirationTime / 1000)
                }
            };
            await admin.auth().setCustomUserClaims(auth.uid, claims);
            auth.role = userData.role;
        } else {
            return c.text('Forbidden', 403);
        }
    }
    // Check if admin
    if (auth.role !== 'admin') {
        return c.text('Forbidden', 403);
    }
    c.set('auth', auth);
    return await next();
}