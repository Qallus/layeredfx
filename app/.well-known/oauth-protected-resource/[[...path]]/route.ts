// RFC 9728 protected resource metadata for /api/mcp (served at the root and at the path-suffixed address).
import {protectedResource, siteOrigin} from '@/lib/mcp/http';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return Response.json(protectedResource(siteOrigin(request)), {headers: {'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*'}});
}
