import {NextRequest} from "next/server";
import {currentUser} from "@/lib/server/auth";
import {sameOrigin} from "@/lib/request-origin";
import {AcademicError} from "@/lib/server/academic";
import {academyAction,academyCourses} from "@/lib/server/academy";
export const runtime='nodejs';export const dynamic='force-dynamic';
async function handle(request:NextRequest,{params}:{params:Promise<{path:string[]}>}){try{
 const user=await currentUser();if(!user)throw new AcademicError('سجّل الدخول أولًا.',401);const path=(await params).path.join('/');const admin=path.startsWith('admin/');if(user.role!==(admin?'admin':'student'))throw new AcademicError('غير مسموح لحسابك.',403);
 if(request.method==='GET'&&path===(admin?'admin/state':'state'))return Response.json({courses:academyCourses(user)},{headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')throw new AcademicError('المسار غير متاح.',404);
 if(!sameOrigin(request))throw new AcademicError('مصدر الطلب غير مسموح.',403);if(!request.headers.get('content-type')?.startsWith('application/json'))throw new AcademicError('استخدم JSON.',415);const raw=await request.text();if(raw.length>64000)throw new AcademicError('الدرس أكبر من الحد المسموح.',413);let data;try{data=JSON.parse(raw);}catch{throw new AcademicError('الطلب غير صالح.');}if(!data||typeof data!=='object'||Array.isArray(data))throw new AcademicError('الطلب غير صالح.');
 const action=admin?path.slice(6):path;if(!admin&&!['enroll','progress'].includes(action))throw new AcademicError('المسار غير متاح.',404);return Response.json(academyAction(user,action,data),{headers:{'Cache-Control':'no-store'}});
 }catch(error){if(error instanceof AcademicError)return Response.json({error:error.message},{status:error.status});console.error('Academy failure',error instanceof Error?error.message:'unknown');return Response.json({error:'تعذر إتمام العملية. حاول مرة أخرى.'},{status:500});}}
export const GET=handle;export const POST=handle;
