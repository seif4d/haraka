import {catalog,profileForCourse} from './catalog.ts';
import {studentSearch} from './admin-students.ts';
import type {LibraryItem} from './academic-domain';
export const LIBRARY_PAGE_SIZE=12;
const courses=new Map(catalog.map(c=>[c.id,c]));
export const libraryCourseTitle=(id:string)=>courses.get(id)?.title||'مقرر غير مفهرس';
export function libraryResults(items:LibraryItem[],params:URLSearchParams){
 const query=studentSearch(params.get('q')||'');
 const filtered=items.filter(item=>{const p=profileForCourse(item.courseId);return (!query||studentSearch(`${item.title} ${libraryCourseTitle(item.courseId)} ${item.source} ${item.description}`).includes(query))&&(!['draft','published'].includes(params.get('status')||'')||item.status===params.get('status'))&&(!['book','summary','reference','worksheet'].includes(params.get('kind')||'')||item.kind===params.get('kind'))&&(!['1','2','3','4'].includes(params.get('year')||'')||String(p?.year)===params.get('year'))&&(!['boys','girls'].includes(params.get('gender')||'')||p?.gender===params.get('gender'))&&(!['general','teaching','training','management'].includes(params.get('track')||'')||p?.track===params.get('track'))&&(!['1','2'].includes(params.get('term')||'')||String(p?.semester)===params.get('term'))&&(!params.get('course')||item.courseId===params.get('course'))&&(params.get('access')!=='file'||!!item.file)&&(params.get('access')!=='link'||!!item.url);}).sort((a,b)=>params.get('sort')==='name'?a.title.localeCompare(b.title,'ar')||a.id.localeCompare(b.id):params.get('sort')==='oldest'?a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id):b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));
 const pages=Math.max(1,Math.ceil(filtered.length/LIBRARY_PAGE_SIZE)),requested=Number(params.get('page')),page=Math.min(pages,Number.isSafeInteger(requested)&&requested>0?requested:1);
 return {filtered,pages,page,rows:filtered.slice((page-1)*LIBRARY_PAGE_SIZE,page*LIBRARY_PAGE_SIZE)};
}
export function libraryUrl(value:string){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}}
