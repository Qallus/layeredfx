import { OperationError } from './engine.mjs';
export function assertSameOrigin(origin, allowed) { if (!origin || !allowed.includes(origin))
    throw new OperationError('This request origin is not allowed.', 403); }
export function parseCommandBody(raw) { if (new TextEncoder().encode(raw).length > 512000)
    throw new OperationError('Request is too large.', 413); let body; try {
    body = JSON.parse(raw);
}
catch {
    throw new OperationError('Invalid JSON.', 400);
} if (!body || !Number.isSafeInteger(body.revision) || body.revision < 0 || !body.command || typeof body.command.type !== 'string')
    throw new OperationError('A command and current revision are required.', 400); return body; }
export function verifyRevision(actual, expected) { if (actual !== expected)
    throw new OperationError('Another team member saved a change. Your edit was not applied. Reload the latest data and retry.', 409); }
export function isUuid(v) { return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v); }
export async function readBody(request, limit = 512000) {
    const reader = request.body?.getReader();
    if (!reader)
        return '';
    const chunks = [];
    let size = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        size += value.byteLength;
        if (size > limit) {
            await reader.cancel();
            throw new OperationError('Request is too large.', 413);
        }
        chunks.push(value);
    }
    const out = new Uint8Array(size);
    let pos = 0;
    for (const c of chunks) {
        out.set(c, pos);
        pos += c.length;
    }
    return new TextDecoder().decode(out);
}
