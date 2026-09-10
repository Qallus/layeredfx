import { cookies } from 'next/headers';
import { OperationError } from '@/lib/operations/engine.mjs';
import { authTokens, checkOrigin, errorResponse, saveTokens, REFRESH_COOKIE } from '@/lib/operations/server';
export async function POST(request: Request) { try {
    checkOrigin(request);
    const token = (await cookies()).get(REFRESH_COOKIE)?.value;
    if (!token)
        throw new OperationError('Sign in required.', 401);
    const tokens = await authTokens('refresh_token', { refresh_token: token });
    await saveTokens(tokens);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return errorResponse(e);
} }
