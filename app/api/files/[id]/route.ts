import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { assignments, resources, visibleTo } from "@/lib/server/academic";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const user=await currentUser();if(!user)return Response.json({error:"سجّل الدخول أولًا."},{status:401});
  const {id}=await params;if(id.length>100)return new Response(null,{status:404});
  const row=db().prepare("SELECT * FROM files WHERE id=?").get(id);if(!row)return new Response(null,{status:404});
  const allowed=user.role==="admin" || row.owner_id===user.id || (user.role==="student" && [...resources(),...assignments()].some(item=>item.file?.id===id && visibleTo(item,user)));
  if(!allowed)return Response.json({error:"الملف غير متاح لحسابك."},{status:404});
  return new Response(new Uint8Array(row.data as Uint8Array),{headers:{"Content-Type":String(row.mime),"Content-Length":String(row.size),"Content-Disposition":`attachment; filename="harka-document"; filename*=UTF-8''${encodeURIComponent(String(row.name))}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}
