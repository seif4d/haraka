import { db } from "@/lib/server/db";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET() {
  try { db().prepare("SELECT 1").get();return Response.json({status:"ok"},{headers:{"Cache-Control":"no-store"}}); }
  catch { return Response.json({status:"error"},{status:503,headers:{"Cache-Control":"no-store"}}); }
}
