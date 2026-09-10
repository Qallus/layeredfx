import { checkOrigin, clearTokens, errorResponse } from '@/lib/operations/server';
export async function POST(request: Request) { try {
    checkOrigin(request);
    await clearTokens();
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return errorResponse(e);
} }
