import 'server-only';
import type {User} from '../domain';
import {normalizeProfile} from '../curriculum';
import {AcademicError} from './academic';
import {passwordHash,publicUser} from './auth';
import {audit,db,transaction} from './db';

function need(value:unknown,message:string,status=400):asserts value {if(!value)throw new AcademicError(message,status);}
function student(id:string){const row=db().prepare("SELECT * FROM users WHERE id=? AND role='student'").get(id);need(row,'حساب الطالب غير موجود.',404);return row;}
function expected(id:string,value:unknown){const row=student(id);const current=publicUser(row as unknown as Parameters<typeof publicUser>[0]);need(value&&typeof value==='object','حدّث ملف الطالب ثم حاول مرة أخرى.',409);const previous=value as Partial<User>;need(previous.email===current.email&&previous.active===current.active&&JSON.stringify(previous.profile)===JSON.stringify(current.profile),'بيانات الحساب اتغيرت. حدّث القائمة وافتح الملف من جديد.',409);return row;}

// Invoked only after the HTTP layer has verified the administrator and same origin.
export async function studentAccount(actor:User,id:string,action:string,data:Record<string,unknown>){
 need(actor.role==='admin','هذا الإجراء متاح للإدارة فقط.',403);
 if(action==='password'){
  const before=expected(id,data.expected);
  need(typeof data.password==='string'&&data.password.length>=10&&data.password.length<=128,'كلمة المرور تحتاج من 10 إلى 128 حرفًا.');
  need(data.password===data.confirmPassword,'كلمتا المرور غير متطابقتين.');
  const hash=await passwordHash(data.password);
  transaction(()=>{const row=expected(id,data.expected);need(row.password_hash===before.password_hash,'اتغيرت كلمة المرور أثناء الحفظ. أعد المحاولة.',409);db().prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash,id);db().prepare('DELETE FROM sessions WHERE user_id=?').run(id);db().prepare('DELETE FROM auth_attempts WHERE key=?').run(`auth/login:${row.email}`);audit(actor.id,'reset_student_password',id);});
  return {updated:true};
 }
 return transaction(()=>{
  const row=expected(id,data.expected);
  if(action==='sessions'){db().prepare('DELETE FROM sessions WHERE user_id=?').run(id);audit(actor.id,'revoke_student_sessions',id);return {updated:true};}
  if(action==='profile'){
   need(typeof data.name==='string'&&data.name.trim().length>=2&&data.name.length<=50,'راجع اسم الطالب: من حرفين إلى 50 حرفًا.');
   need(typeof data.email==='string'&&data.email.length<=254,'راجع البريد الإلكتروني.');const email=data.email.trim().toLowerCase();need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'اكتب بريدًا إلكترونيًا صحيحًا.');
   need(!db().prepare('SELECT 1 FROM users WHERE email=? AND id<>?').get(email,id),'البريد مستخدم لحساب آخر.',409);
   need([1,2,3,4].includes(Number(data.year))&&[1,2].includes(Number(data.semester))&&['boys','girls'].includes(String(data.gender)),'راجع المسار الدراسي.');
   need(Number(data.year)<3?data.track==='general':['training','teaching','management'].includes(String(data.track)),'اختر الشعبة المناسبة للفرقة.');
   const profile=normalizeProfile({...data,name:data.name.trim()});
   need(data.classGroup===undefined||data.classGroup===null||data.classGroup===profile.classGroup,'مجموعة الجدول غير متاحة لهذا المسار.');
   db().prepare('UPDATE users SET email=?,profile=? WHERE id=?').run(email,JSON.stringify(profile),id);
   if(email!==row.email)db().prepare('DELETE FROM sessions WHERE user_id=?').run(id);
   audit(actor.id,'update_student_account',id);
   return {user:publicUser(student(id) as unknown as Parameters<typeof publicUser>[0])};
  }
  need(action==='delete','الإجراء غير موجود.',404);
  need(data.confirmEmail===row.email,'اكتب بريد الطالب كما هو لتأكيد الحذف.');
  db().prepare('DELETE FROM submissions WHERE user_id=?').run(id);
  db().prepare('DELETE FROM exam_attempts WHERE user_id=?').run(id);
  // Keep shared teaching assets even if a former student owned them.
  db().prepare(`DELETE FROM files WHERE owner_id=?
   AND NOT EXISTS(SELECT 1 FROM library_items WHERE file_id=files.id)
   AND NOT EXISTS(SELECT 1 FROM assignments WHERE file_id=files.id)
   AND NOT EXISTS(SELECT 1 FROM submissions WHERE file_id=files.id)
   AND NOT EXISTS(SELECT 1 FROM academy_courses WHERE cover_id=files.id)
   AND NOT EXISTS(SELECT 1 FROM academy_attachments WHERE file_id=files.id)`).run(id);
  db().prepare('UPDATE files SET owner_id=? WHERE owner_id=?').run(actor.id,id);
  db().prepare('UPDATE lessons SET author_id=? WHERE author_id=?').run(actor.id,id);
  db().prepare('DELETE FROM auth_attempts WHERE key=?').run(`auth/login:${row.email}`);
  db().prepare("DELETE FROM users WHERE id=? AND role='student'").run(id);
  audit(actor.id,'delete_student_account',id);
  return {deleted:true};
 });
}
