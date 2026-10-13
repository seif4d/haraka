import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { AcademicError, assignments, visibleTo } from "@/lib/server/academic";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const MAX=20*1024*1024;
async function body(request:NextRequest){const reader=request.body?.getReader();if(!reader)throw new AcademicError("الطلب بدون ملف.");const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX+65536){await reader.cancel();throw new AcademicError("الحد الأقصى للملف 20 ميجابايت.",413);}chunks.push(value);}const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}return result;}
export async function POST(request:NextRequest){try{
  const user=await currentUser();if(!user)throw new AcademicError("سجّل الدخول أولًا.",401);
  if(request.headers.get("origin")!==`${request.nextUrl.protocol}//${request.headers.get("host")}`)throw new AcademicError("مصدر الطلب غير مسموح.",403);
  if(!request.headers.get("content-type")?.startsWith("multipart/form-data"))throw new AcademicError("طلب رفع الملف غير صالح.",415);
  const form=await new Response(await body(request),{headers:{"Content-Type":request.headers.get("content-type")!}}).formData();
  const purpose=form.get("purpose");const assignmentId=form.get("assignmentId");
  if(purpose==="material"){if(user.role!=="admin")throw new AcademicError("رفع محتوى المنصة للإدارة فقط.",403);}
  else if(purpose==="submission"){
    if(user.role!=="student" || typeof assignmentId!=="string")throw new AcademicError("التسليم خاص بالطالب.",403);
    const assignment=assignments().find(a=>a.id===assignmentId && visibleTo(a,user));if(!assignment)throw new AcademicError("التكليف غير متاح.",404);
    if(Date.now()>Date.parse(assignment.dueAt))throw new AcademicError("انتهى موعد التسليم.",409);
  }else throw new AcademicError("استخدام الملف غير صالح.");
  const file=form.get("file");if(!(file instanceof File) || file.size<1 || file.size>MAX)throw new AcademicError("اختار ملفًا حتى 20 ميجابايت.",413);
  const bytes=Buffer.from(await file.arrayBuffer());const name=file.name.replace(/\\/g,"/").split("/").pop()!.replace(/[\x00-\x1f\x7f]/g,"").slice(0,140);
  let mime="";
  if(name.toLowerCase().endsWith(".pdf") && bytes.subarray(0,5).toString()==="%PDF-")mime="application/pdf";
  if(name.toLowerCase().endsWith(".docx") && bytes[0]===0x50 && bytes[1]===0x4b && bytes[2]===3 && bytes[3]===4)mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if(/\.png$/i.test(name) && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))mime="image/png";
  if(/\.jpe?g$/i.test(name) && bytes[0]===255 && bytes[1]===216 && bytes[2]===255)mime="image/jpeg";
  if(!mime)throw new AcademicError("ارفع PDF أو DOCX أو صورة PNG/JPG صحيحة.");
  const id=randomUUID();db().prepare("INSERT INTO files VALUES(?,?,?,?,?,?,?,?,?)").run(id,user.id,name,mime,bytes.byteLength,purpose,typeof assignmentId==="string"?assignmentId:null,bytes,new Date().toISOString());
  return Response.json({file:{id,name,mime,size:bytes.byteLength}},{status:201,headers:{"Cache-Control":"no-store"}});
}catch(error){return Response.json({error:error instanceof AcademicError?error.message:"تعذر رفع الملف."},{status:error instanceof AcademicError?error.status:500});}}
