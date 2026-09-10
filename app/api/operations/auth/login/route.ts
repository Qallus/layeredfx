import { readBody } from '@/lib/operations/security.mjs';
import { OperationError } from '@/lib/operations/engine.mjs';
import { authTokens, checkOrigin, errorResponse, saveTokens } from '@/lib/operations/server';
export async function POST(request: Request) { try {
    checkOrigin(request);
    const raw = await readBody(request, 12000);
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new OperationError('Invalid JSON.', 400);
    }
    const { email, password } = parsed || {};
    if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 4096)
        throw new OperationError('Enter an email and password.', 400);
    const tokens = await authTokens('password', { email: email.trim(), password });
    await saveTokens(tokens);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return errorResponse(e);
} }
