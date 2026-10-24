// RFC 8414 authorization server metadata for the LayeredFX MCP OAuth flow.
import {authorizationServer, siteOrigin} from '@/lib/mcp/http';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  return Response.json(authorizationServer(siteOrigin(request)), {headers: {'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*'}});
}
