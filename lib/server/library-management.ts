import 'server-only';
import {AcademicError} from './academic';
import {audit,db,transaction} from './db';
import type {User} from '../domain';
export function libraryStatus(data:Record<string,unknown>,user:User){
 if(user.role!=='admin')throw new AcademicError('هذه المساحة للإدارة فقط.',403);
 if(!['draft','published'].includes(String(data.status)))throw new AcademicError('اختر حالة النشر.');
 if(!Array.isArray(data.items)||!data.items.length||data.items.length>100)throw new AcademicError('حدّد من مورد واحد إلى 100 مورد.');
 const ids=new Set<string>();const items=data.items.map(value=>{if(!value||typeof value!=='object')throw new AcademicError('راجع الموارد المحددة.');const item=value as Record<string,unknown>;if(typeof item.id!=='string'||!item.id||item.id.length>100||typeof item.updatedAt!=='string'||ids.has(item.id))throw new AcademicError('الموارد المحددة غير صالحة أو مكررة.');ids.add(item.id);return {id:item.id,updatedAt:item.updatedAt};});
 return transaction(()=>{
  for(const item of items){const row=db().prepare('SELECT updated_at FROM library_items WHERE id=?').get(item.id);if(!row||row.updated_at!==item.updatedAt)throw new AcademicError('أحد الموارد اتغير أو اتحذف. حدّث المكتبة وراجع التحديد قبل الحفظ.',409);}
  for(const item of items){const at=new Date(Math.max(Date.now(),Date.parse(item.updatedAt)+1)).toISOString();db().prepare('UPDATE library_items SET status=?,updated_at=? WHERE id=?').run(String(data.status),at,item.id);audit(user.id,'update_library_status',item.id);}
  return {updated:items.length};
 });
}
