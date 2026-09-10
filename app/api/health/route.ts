export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ status: "ok", application: "layeredfx-homepage", mode: "preview" });
}
