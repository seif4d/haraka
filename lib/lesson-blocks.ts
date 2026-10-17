import { lessonLink, lessonVideoId } from "./lesson-links.ts";
export type BlockBase = {id:string;title:string;body:string};
export type LessonBlock = BlockBase & (
  | {type:"text"}
  | {type:"paragraph"}
  | {type:"heading";level:2|3}
  | {type:"list";style:"bullet"|"number"}
  | {type:"checklist"}
  | {type:"callout";tone:"idea"|"note"|"warning"|"success"}
  | {type:"quote";attribution:string}
  | {type:"divider"}
  | {type:"toggle"}
  | {type:"table";headers:string[];rows:string[][]}
  | {type:"video";url:string}
  | {type:"resource";url:string}
  | {type:"explore";items:{title:string;body:string}[]}
  | {type:"cards";cards:{front:string;back:string}[]}
  | {type:"quiz";options:string[];correctIndex:number;explanation:string}
  | {type:"sequence";steps:string[];explanation:string}
  | {type:"simulation";model:"training-load"|"recovery"}
  | {type:"story";scene:"track"|"court"|"team"|"lab";choices:{title:string;feedback:string}[];bestIndex:number;takeaway:string}
  | {type:"timeline";events:{label:string;title:string;body:string}[];conclusion:string}
  | {type:"map";center:string;nodes:{label:string;body:string;example:string}[]}
  | {type:"sort";categories:string[];items:{text:string;category:number;explanation:string}[];summary:string}
  | {type:"lab";model:"load-wave"|"training-cycle"|"individuality"|"evidence"}
  | {type:"reading";sections:{title:string;body:string}[]}
);
export type BlockType = LessonBlock["type"];
export const WRITING_TYPES:BlockType[]=['heading','list','checklist','callout','quote','divider','toggle','table','video','resource'];
export const INTERACTIVE_TYPES:BlockType[]=['checklist','toggle','explore','cards','quiz','sequence','simulation','story','timeline','map','sort','lab'];
export function hasLessonContent(blocks:LessonBlock[]){return blocks.some(b=>b.type!=='divider');}
export const BLOCK_LABELS:Record<BlockType,string>={heading:"عنوان",list:"قائمة",checklist:"قائمة مراجعة",callout:"بطاقة تنبيه",quote:"اقتباس",divider:"فاصل",toggle:"محتوى قابل للطي",table:"جدول",video:"فيديو يوتيوب",resource:"بطاقة مرجع",paragraph:"نص",text:"شرح قصير",explore:"استكشف وقارن",cards:"بطاقات اكتشاف",quiz:"سؤال وموقف",sequence:"رتّب الخطوات",simulation:"معمل تفاعلي",story:"موقف افتتاحي",timeline:"رحلة زمنية",map:"خريطة مفاهيم",sort:"تحدّي التصنيف",lab:"استوديو التجربة",reading:"تعمّق أكاديمي"};
export function newLessonBlock(type:BlockType,id:string):LessonBlock {
  const base={id,title:"",body:""};
  switch(type){
    case "heading":return {...base,type,level:2};
    case "list":return {...base,type,style:"bullet"};
    case "checklist":return {...base,type};
    case "callout":return {...base,type,tone:"idea"};
    case "quote":return {...base,type,attribution:""};
    case "divider":return {...base,type};
    case "toggle":return {...base,type};
    case "table":return {...base,type,headers:["",""],rows:[["",""]]};
    case "video":case "resource":return {...base,type,url:""};
    case "paragraph":return {...base,type};
    case "text":return {...base,type};
    case "explore":return {...base,type,items:[{title:"الفكرة الأولى",body:""},{title:"الفكرة الثانية",body:""}]};
    case "cards":return {...base,type,cards:[{front:"المصطلح الأول",back:""},{front:"المصطلح الثاني",back:""}]};
    case "quiz":return {...base,type,options:["","",""],correctIndex:0,explanation:""};
    case "sequence":return {...base,type,steps:["","",""],explanation:""};
    case "simulation":return {...base,type,model:"training-load"};
    case "story":return {...base,type,scene:"court",choices:[{title:"",feedback:""},{title:"",feedback:""},{title:"",feedback:""}],bestIndex:0,takeaway:""};
    case "timeline":return {...base,type,events:[{label:"01",title:"",body:""},{label:"02",title:"",body:""}],conclusion:""};
    case "map":return {...base,type,center:"الفكرة الأساسية",nodes:[{label:"",body:"",example:""},{label:"",body:"",example:""},{label:"",body:"",example:""}]};
    case "sort":return {...base,type,categories:["الفئة الأولى","الفئة الثانية"],items:[{text:"",category:0,explanation:""},{text:"",category:1,explanation:""}],summary:""};
    case "lab":return {...base,type,model:"load-wave"};
    case "reading":return {...base,type,sections:[{title:"",body:""}]};
  }
}

export function validateLessonBlocks(value:unknown):LessonBlock[] {
  const fail=()=>{throw new Error("راجع المقاطع: أكمل الحقول المطلوبة، واستخدم اختيارات مختلفة وروابط HTTPS صالحة. الحد ٦٤ مقطعًا.");};
  if(!Array.isArray(value)||value.length>64||JSON.stringify(value).length>48000)return fail();
  const text=(value:unknown,min:number,max:number):string=>typeof value==="string"&&value.trim().length>=min&&value.length<=max?value.trim():fail();
  const record=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:fail();
  const list=(value:unknown,min:number,max:number):unknown[]=>Array.isArray(value)&&value.length>=min&&value.length<=max?value:fail();
  const unique=(items:string[])=>new Set(items).size===items.length?items:fail();
  const ids=new Set<string>();
  return value.map(raw=>{
    const b=record(raw);const id=text(b.id,1,60);if(!/^[a-zA-Z0-9-]+$/.test(id)||ids.has(id))return fail();ids.add(id);
    const base={id,title:text(b.title,(b.type==="paragraph"||WRITING_TYPES.includes(b.type as BlockType))?0:2,150),body:text(b.body??"",0,3000)};
    switch(b.type){
      case "heading":if(b.level!==2&&b.level!==3)return fail();return {...base,type:"heading",body:text(b.body,1,150),level:b.level};
      case "list":case "checklist":{const body=text(b.body,1,3000);const lines=body.split('\n').map(s=>s.trim()).filter(Boolean);if(lines.length>40||lines.some(s=>s.length>300))return fail();if(b.type==="checklist")return {...base,type:"checklist",body};if(b.style!=="bullet"&&b.style!=="number")return fail();return {...base,type:"list",body,style:b.style};}
      case "callout":if(!["idea","note","warning","success"].includes(String(b.tone)))return fail();return {...base,type:"callout",body:text(b.body,1,3000),tone:b.tone as "idea"|"note"|"warning"|"success"};
      case "quote":return {...base,type:"quote",body:text(b.body,1,3000),attribution:text(b.attribution??"",0,120)};
      case "divider":return {...base,type:"divider",body:"",title:""};
      case "toggle":return {...base,type:"toggle",title:text(b.title,2,150),body:text(b.body,1,3000)};
      case "table":{const headers=list(b.headers,2,5).map(h=>text(h,1,120));const rows=list(b.rows,1,12).map(r=>list(r,headers.length,headers.length).map(c=>text(c,0,400)));if(!rows.some(r=>r.some(Boolean)))return fail();return {...base,type:"table",headers,rows};}
      case "video":case "resource":{const url=text(b.url,1,2048);if(!lessonLink(url)||(b.type==="video"&&!lessonVideoId(url)))return fail();return {...base,type:b.type,url};}
      case "paragraph":return {...base,type:"paragraph",body:text(b.body,1,3000)};
      case "text":return {...base,type:"text",body:text(b.body,2,3000)};
      case "explore":{const items=list(b.items,2,6).map(raw=>{const item=record(raw);return {title:text(item.title,1,100),body:text(item.body,2,1200)};});unique(items.map(i=>i.title));return {...base,type:"explore",items};}
      case "cards":return {...base,type:"cards",cards:list(b.cards,2,8).map(raw=>{const card=record(raw);return {front:text(card.front,1,150),back:text(card.back,2,600)};})};
      case "quiz":{const options=unique(list(b.options,3,3).map(o=>text(o,1,300)));if(!Number.isInteger(b.correctIndex)||Number(b.correctIndex)<0||Number(b.correctIndex)>2)return fail();return {...base,type:"quiz",options,correctIndex:Number(b.correctIndex),explanation:text(b.explanation,2,2000)};}
      case "sequence":return {...base,type:"sequence",steps:unique(list(b.steps,3,6).map(s=>text(s,1,250))),explanation:text(b.explanation,2,1500)};
      case "simulation":if(b.model!=="training-load"&&b.model!=="recovery")return fail();return {...base,type:"simulation",model:b.model};
      case "story":{if(!["track","court","team","lab"].includes(String(b.scene)) || !Number.isInteger(b.bestIndex) || Number(b.bestIndex)<0 || Number(b.bestIndex)>2)return fail();const choices=list(b.choices,3,3).map(raw=>{const c=record(raw);return {title:text(c.title,2,180),feedback:text(c.feedback,2,1200)};});unique(choices.map(c=>c.title));return {...base,type:"story",scene:b.scene as "track"|"court"|"team"|"lab",choices,bestIndex:Number(b.bestIndex),takeaway:text(b.takeaway,2,1000)};}
      case "timeline":return {...base,type:"timeline",events:list(b.events,2,6).map(raw=>{const e=record(raw);return {label:text(e.label,1,60),title:text(e.title,2,100),body:text(e.body,2,1500)};}),conclusion:text(b.conclusion,2,1000)};
      case "map":{const nodes=list(b.nodes,3,6).map(raw=>{const n=record(raw);return {label:text(n.label,2,80),body:text(n.body,2,1500),example:text(n.example,2,1000)};});unique(nodes.map(n=>n.label));return {...base,type:"map",center:text(b.center,2,80),nodes};}
      case "sort":{const categories=unique(list(b.categories,2,5).map(c=>text(c,2,80)));const items=list(b.items,2,8).map(raw=>{const item=record(raw);if(!Number.isInteger(item.category)||Number(item.category)<0||Number(item.category)>=categories.length)return fail();return {text:text(item.text,2,500),category:Number(item.category),explanation:text(item.explanation,2,1200)};});return {...base,type:"sort",categories,items,summary:text(b.summary,2,1000)};}
      case "lab":if(!["load-wave","training-cycle","individuality","evidence"].includes(String(b.model)))return fail();return {...base,type:"lab",model:b.model as "load-wave"|"training-cycle"|"individuality"|"evidence"};
      case "reading":return {...base,type:"reading",sections:list(b.sections,1,16).map(raw=>{const s=record(raw);return {title:text(s.title,2,150),body:text(s.body,2,3000)};})};
      default:return fail();
    }
  });
}
