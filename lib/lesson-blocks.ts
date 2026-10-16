export type BlockBase = {id:string;title:string;body:string};
export type LessonBlock = BlockBase & (
  | {type:"text"}
  | {type:"explore";items:{title:string;body:string}[]}
  | {type:"cards";cards:{front:string;back:string}[]}
  | {type:"quiz";options:string[];correctIndex:number;explanation:string}
  | {type:"sequence";steps:string[];explanation:string}
  | {type:"simulation";model:"training-load"|"recovery"}
);
export type BlockType = LessonBlock["type"];
export const BLOCK_LABELS:Record<BlockType,string>={text:"شرح قصير",explore:"استكشف وقارن",cards:"بطاقات اكتشاف",quiz:"سؤال وموقف",sequence:"رتّب الخطوات",simulation:"معمل تفاعلي"};
export function newLessonBlock(type:BlockType,id:string):LessonBlock {
  const base={id,title:"",body:""};
  switch(type){
    case "text":return {...base,type};
    case "explore":return {...base,type,items:[{title:"الفكرة الأولى",body:""},{title:"الفكرة الثانية",body:""}]};
    case "cards":return {...base,type,cards:[{front:"المصطلح الأول",back:""},{front:"المصطلح الثاني",back:""}]};
    case "quiz":return {...base,type,options:["","",""],correctIndex:0,explanation:""};
    case "sequence":return {...base,type,steps:["","",""],explanation:""};
    case "simulation":return {...base,type,model:"training-load"};
  }
}

export function validateLessonBlocks(value:unknown):LessonBlock[] {
  const fail=()=>{throw new Error("راجع الوحدات التفاعلية: عنوان ومحتوى مكتمل، اختيارات مختلفة، وبحد أقصى 16 وحدة.");};
  if(!Array.isArray(value)||value.length>16||JSON.stringify(value).length>30000)return fail();
  const text=(value:unknown,min:number,max:number):string=>typeof value==="string"&&value.trim().length>=min&&value.length<=max?value.trim():fail();
  const record=(value:unknown):Record<string,unknown>=>value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:fail();
  const list=(value:unknown,min:number,max:number):unknown[]=>Array.isArray(value)&&value.length>=min&&value.length<=max?value:fail();
  const unique=(items:string[])=>new Set(items).size===items.length?items:fail();
  const ids=new Set<string>();
  return value.map(raw=>{
    const b=record(raw);const id=text(b.id,1,60);if(!/^[a-zA-Z0-9-]+$/.test(id)||ids.has(id))return fail();ids.add(id);
    const base={id,title:text(b.title,2,150),body:text(b.body??"",0,3000)};
    switch(b.type){
      case "text":return {...base,type:"text",body:text(b.body,2,3000)};
      case "explore":{const items=list(b.items,2,6).map(raw=>{const item=record(raw);return {title:text(item.title,1,100),body:text(item.body,2,1200)};});unique(items.map(i=>i.title));return {...base,type:"explore",items};}
      case "cards":return {...base,type:"cards",cards:list(b.cards,2,8).map(raw=>{const card=record(raw);return {front:text(card.front,1,150),back:text(card.back,2,600)};})};
      case "quiz":{const options=unique(list(b.options,3,3).map(o=>text(o,1,300)));if(!Number.isInteger(b.correctIndex)||Number(b.correctIndex)<0||Number(b.correctIndex)>2)return fail();return {...base,type:"quiz",options,correctIndex:Number(b.correctIndex),explanation:text(b.explanation,2,2000)};}
      case "sequence":return {...base,type:"sequence",steps:unique(list(b.steps,3,6).map(s=>text(s,1,250))),explanation:text(b.explanation,2,1500)};
      case "simulation":if(b.model!=="training-load"&&b.model!=="recovery")return fail();return {...base,type:"simulation",model:b.model};
      default:return fail();
    }
  });
}
