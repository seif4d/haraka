"use client";
import { useEffect, useLayoutEffect, useId, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type Ref, type TextareaHTMLAttributes } from "react";
import { AlignRight, ArrowDown, ArrowUp, CheckSquare, ChevronDown, Copy, Eye, GripVertical, Heading2, Link2, List as ListIcon, Minus, Plus, Quote, Redo2, Search, Sparkles, Table2, Trash2, Type, Undo2, X, Play } from "lucide-react";
import { BLOCK_LABELS, WRITING_TYPES, newLessonBlock, validateLessonBlocks, type BlockType, type LessonBlock } from "@/lib/lesson-blocks";
import { COMMAND_GROUPS, LESSON_COMMANDS, commandBlock, normalizeCommand, type CommandGroup, type LessonCommand } from "@/lib/lesson-commands";
import { TRAINING_EXPERIENCE } from "@/lib/training-experience";
import LessonBlocks from "./lesson-blocks";
import LessonBlockFields from "./lesson-block-fields";
import LessonWritingFields, {type WritingBlock} from "./lesson-writing-fields";
import s from "./lesson-document-editor.module.css";

export type LessonEditorHandle={openMenu:(group?:CommandGroup)=>void};
export default function LessonDocumentEditor({blocks,onChange,integrated=false,editorRef}:{blocks:LessonBlock[];onChange:(blocks:LessonBlock[])=>void;integrated?:boolean;editorRef?:Ref<LessonEditorHandle>}){
  const uid=useId();const root=useRef<HTMLDivElement>(null);const refs=useRef(new Map<string,HTMLElement>());const searchRef=useRef<HTMLInputElement>(null);
  const pending=useRef<{id:string;caret?:number}|null>(null);
  const history=useRef<{past:LessonBlock[][];future:LessonBlock[][];typing:string;time:number}>({past:[],future:[],typing:'',time:0});
  const [revision,setRevision]=useState(0);const [preview,setPreview]=useState(false);const [menu,setMenu]=useState<{id:string;query:string;search:boolean}|null>(null);
  const [group,setGroup]=useState<CommandGroup|'all'>('all');const [choice,setChoice]=useState(0);const [expanded,setExpanded]=useState<string[]>([]);const [drag,setDrag]=useState('');const [removed,setRemoved]=useState(false);const [message,setMessage]=useState('');
  const commands=useMemo(()=>LESSON_COMMANDS.filter(command=>menu?.query?normalizeCommand(`${command.label} ${command.aliases}`).includes(normalizeCommand(menu.query)):group==='all'||command.group===group),[menu?.query,group]);
  useImperativeHandle(editorRef,()=>({openMenu:(group)=>open('tail','',true,group)}));
  useLayoutEffect(()=>{if(pending.current){const el=refs.current.get(pending.current.id);if(el){el.focus();if(pending.current.caret!==undefined&&(el instanceof HTMLTextAreaElement||(el instanceof HTMLInputElement&&['text','search'].includes(el.type))))el.setSelectionRange(pending.current.caret,pending.current.caret);pending.current=null;}}},[blocks]);
  useLayoutEffect(()=>{if(menu?.search)searchRef.current?.focus({preventScroll:true});},[menu?.id,menu?.search]);
  useEffect(()=>setChoice(0),[menu?.query,menu?.id,group]);
  useEffect(()=>{if(menu)document.getElementById(`${uid}-${commands[choice]?.key}`)?.scrollIntoView({block:'nearest'});},[choice,commands,menu?.id,uid]);
  useEffect(()=>{if(!menu)return;const outside=(event:MouseEvent)=>{const target=event.target as Element;if(!target.closest('[data-command-menu],[data-open-menu]')&&target!==refs.current.get(menu.id))setMenu(null);};document.addEventListener('click',outside);return()=>document.removeEventListener('click',outside);},[menu]);
  function focus(id:string,caret?:number){pending.current={id,caret};}
  function register(id:string,element:HTMLElement|null){if(element)refs.current.set(id,element);else refs.current.delete(id);}
  function commit(next:LessonBlock[],typing=''){
    const h=history.current;const now=Date.now();if(!typing||typing!==h.typing||now-h.time>900){h.past.push(structuredClone(blocks));if(h.past.length>40)h.past.shift();}
    h.future=[];h.typing=typing;h.time=now;setRevision(v=>v+1);setRemoved(false);onChange(next);
  }
  function undo(){const h=history.current;if(!h.past.length)return;h.future.push(structuredClone(blocks));const next=h.past.pop()!;h.typing='';setMenu(null);setRemoved(false);setRevision(v=>v+1);onChange(next);setMessage('تم التراجع عن آخر تعديل في المقاطع.');}
  function redo(){const h=history.current;if(!h.future.length)return;h.past.push(structuredClone(blocks));const next=h.future.pop()!;h.typing='';setMenu(null);setRevision(v=>v+1);onChange(next);setMessage('تمت إعادة التعديل.');}
  function change(id:string,value:LessonBlock,typing=true){if(menu)setMenu(null);commit(blocks.map(b=>b.id===id?value:b),typing?id:'');}
  function open(id:string,query='',search=false,category:CommandGroup|'all'='all'){if(id==='tail'&&blocks.length>=64){setMessage('وصلت للحد الأقصى: ٦٤ مقطعًا.');return;}setGroup(category);setChoice(0);setMenu({id,query,search});}
  function insert(command:LessonCommand,id:string,forceReplace=false){
    const index=blocks.findIndex(b=>b.id===id);const replace=index>=0&&blocks[index].type==='paragraph'&&(forceReplace||!blocks[index].body.trim()||blocks[index].body==='--'||/^\s*\/[^\n]*$/.test(blocks[index].body));
    if(blocks.length>=64&&!replace){setMessage('وصلت للحد الأقصى: ٦٤ مقطعًا.');return;}
    const block=commandBlock(command,crypto.randomUUID());const next=[...blocks];const at=index<0?next.length:index+(replace?0:1);next.splice(at,replace?1:0,block);
    if(block.type==='divider'&&next.length<64){const paragraph=newLessonBlock('paragraph',crypto.randomUUID());next.splice(at+1,0,paragraph);focus(paragraph.id,0);}else focus(block.id,0);
    commit(next);setExpanded(ids=>[...ids,block.id]);setMenu(null);
  }
  function addParagraph(index:number,body=''){if(blocks.length>=64){setMessage('وصلت للحد الأقصى: ٦٤ مقطعًا.');return;}const next=[...blocks];const paragraph={...newLessonBlock('paragraph',crypto.randomUUID()),body};next.splice(index+1,0,paragraph);focus(paragraph.id,0);commit(next);setMenu(null);}
  function remove(index:number){focus(blocks[index-1]?.id||'tail');commit(blocks.filter((_,i)=>i!==index));setRemoved(true);setMenu(null);}
  function move(from:number,to:number){if(from===to||from<0||to<0||to>=blocks.length)return;const next=[...blocks];next.splice(to,0,next.splice(from,1)[0]);commit(next);setMessage('اتغيّر ترتيب المقطع.');}
  function write(id:string,value:string){
    const shortcut:Record<string,string>={'## ':'heading','### ':'heading-3','- ':'list','1. ':'list-number','> ':'quote','[] ':'checklist','---':'divider'};
    if(id==='tail'){
      if(!value)return;if(shortcut[value]){insert(LESSON_COMMANDS.find(c=>c.key===shortcut[value])!,'tail');return;}const block={...newLessonBlock('paragraph',crypto.randomUUID()),body:value};focus(block.id,value.length);commit([...blocks,block],block.id);if(/^\s*\/[^\n]*$/.test(value))open(block.id,value.trimStart().slice(1));return;
    }
    const block=blocks.find(b=>b.id===id)!;
    if(block.type==='paragraph'){

      if(value==='---'){insert(LESSON_COMMANDS.find(c=>c.type==='divider')!,id,true);return;}
      if(shortcut[value]){const command=LESSON_COMMANDS.find(c=>c.key===shortcut[value])!;const converted=commandBlock(command,id);focus(id,0);commit(blocks.map(b=>b.id===id?converted:b));setMenu(null);return;}
    }
    change(id,{...block,body:value});if(block.type==='paragraph'&&/^\s*\/[^\n]*$/.test(value))open(id,value.trimStart().slice(1));
  }
  function keys(event:KeyboardEvent<HTMLTextAreaElement>,id:string){
    if(event.nativeEvent.isComposing)return;const index=blocks.findIndex(b=>b.id===id);const block=blocks[index];const input=event.currentTarget;
    if(menu?.id===id){if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();setChoice(i=>commands.length?(i+(event.key==='ArrowDown'?1:-1)+commands.length)%commands.length:0);return;}if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setMenu(null);return;}if(event.key==='Enter'&&commands.length){event.preventDefault();insert(commands[choice]||commands[0],id);return;}if(event.key==='Tab')setMenu(null);}
    if(event.altKey&&['ArrowUp','ArrowDown'].includes(event.key)&&index>=0){event.preventDefault();move(index,index+(event.key==='ArrowUp'?-1:1));return;}
    if((event.ctrlKey||event.metaKey)&&event.key==='Enter'&&index>=0){event.preventDefault();addParagraph(index);return;}
    if(!event.shiftKey&&!event.ctrlKey&&!event.metaKey&&event.key==='Enter'){
      if(block?.type==='list'||block?.type==='checklist'){
        if(input.selectionStart===input.value.length&&(!input.value||input.value.endsWith('\n'))){event.preventDefault();if(!input.value){change(id,{id,type:'paragraph',title:'',body:''},false);focus(id,0);}else{const next=[...blocks];next[index]={...block,body:input.value.trimEnd()};if(next.length>=64){setMessage('وصلت للحد الأقصى: ٦٤ مقطعًا.');return;}const paragraph=newLessonBlock('paragraph',crypto.randomUUID());next.splice(index+1,0,paragraph);focus(paragraph.id,0);commit(next);}return;}
        return;
      }
      if(!block||block.type==='paragraph'||block.type==='heading'){
        event.preventDefault();if(blocks.length>=64){setMessage('وصلت للحد الأقصى: ٦٤ مقطعًا.');return;}const next=[...blocks];const paragraph={...newLessonBlock('paragraph',crypto.randomUUID()),body:input.value.slice(input.selectionEnd)};if(index>=0)next[index]={...block,body:input.value.slice(0,input.selectionStart)};next.splice(index<0?next.length:index+1,0,paragraph);focus(paragraph.id,0);commit(next);setMenu(null);return;
      }
    }
    if(event.key==='Backspace'&&!event.shiftKey&&index>=0){
      if(input.value===''&&(block.type==='paragraph'||block.type==='heading')){event.preventDefault();remove(index);return;}
      const previous=blocks[index-1];if(input.selectionStart===0&&input.selectionEnd===0&&block.type==='paragraph'&&previous?.type==='paragraph'&&previous.body.length+block.body.length<=3000){event.preventDefault();const next=blocks.filter((_,i)=>i!==index);next[index-1]={...previous,body:previous.body+block.body};focus(previous.id,previous.body.length);commit(next);return;}
    }
    if(!event.shiftKey&&!event.ctrlKey&&!event.metaKey&&['ArrowUp','ArrowDown'].includes(event.key)){
      const up=event.key==='ArrowUp';if((up&&input.selectionStart===0&&input.selectionEnd===0)||(!up&&input.selectionStart===input.value.length)){if(index<0&&!up)return;const adjacent=blocks[index<0?blocks.length-1:index+(up?-1:1)];const element=adjacent?refs.current.get(adjacent.id):!up?refs.current.get('tail'):null;if(element){event.preventDefault();element.focus();if(element instanceof HTMLTextAreaElement)element.setSelectionRange(up?element.value.length:0,up?element.value.length:0);}}
    }
  }
  function paste(event:React.ClipboardEvent<HTMLTextAreaElement>,id:string){
    const text=event.clipboardData.getData('text/plain').replace(/\r\n/g,'\n');if(!/\n\s*\n/.test(text))return;
    const current=blocks.find(b=>b.id===id);if(current&&current.type!=='paragraph')return;
    const input=event.currentTarget;const combined=input.value.slice(0,input.selectionStart)+text+input.value.slice(input.selectionEnd);const pieces=combined.split(/\n\s*\n/);const index=blocks.findIndex(b=>b.id===id);
    event.preventDefault();if(blocks.length-(index>=0?1:0)+pieces.length>64||pieces.some(piece=>piece.length>3000)){setMessage('النص كبير على المساحة المتاحة. الصقه على أجزاء؛ لم يتغيّر النص الموجود.');return;}
    const added=pieces.map((body,i)=>({...newLessonBlock('paragraph',i===0&&current?current.id:crypto.randomUUID()),body}));const next=[...blocks];next.splice(index<0?next.length:index,index<0?0:1,...added);focus(added[added.length-1].id,added[added.length-1].body.length);commit(next);setMenu(null);
  }
  function commandMenu(id:string){return menu?.id===id&&<div className={s.command} data-command-menu role="region" aria-label="إضافة مقطع" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setMenu(null);refs.current.get(id)?.focus();}}}>
    <header><span className={s.commandBrand}>/</span><div><strong>كل فكرة ليها شكل.</strong><small>اختار المقطع المناسب وكمل الحكاية</small></div><button type="button" aria-label="إغلاق قائمة المقاطع" onClick={()=>setMenu(null)}><X size={16}/></button></header>
    <label className={s.commandSearch}><Search size={15}/><input ref={searchRef} role="combobox" aria-expanded="true" aria-controls={`${uid}-commands`} aria-activedescendant={commands[choice]?`${uid}-${commands[choice].key}`:undefined} aria-label="ابحث عن نوع المقطع" placeholder="عنوان، جدول، سؤال، فيديو…" value={menu.query} onChange={e=>setMenu({...menu,query:e.target.value})} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setChoice(i=>commands.length?(i+(e.key==='ArrowDown'?1:-1)+commands.length)%commands.length:0);}if(e.key==='Enter'&&commands.length){e.preventDefault();insert(commands[choice]||commands[0],id);}if(e.key==='Tab')setMenu(null);}}/><kbd>⌕</kbd></label>
    <div className={s.commandGroups} role="group" aria-label="فئات المقاطع">{[['all','الكل'],...Object.entries(COMMAND_GROUPS)].map(([key,label])=><button type="button" key={key} aria-pressed={group===key} onClick={()=>{setGroup(key as CommandGroup|'all');setMenu({...menu,query:''});}}>{label}</button>)}</div>
    <div id={`${uid}-commands`} role="listbox" aria-label="أنواع المقاطع">{commands.map((command,i)=><button key={command.key} type="button" role="option" tabIndex={-1} id={`${uid}-${command.key}`} aria-selected={i===choice} onMouseEnter={()=>setChoice(i)} onMouseDown={e=>e.preventDefault()} onClick={()=>insert(command,id)}><span className={s[`command-${command.group}`]}><CommandIcon type={command.type}/></span><div><strong>{command.label}</strong><small>{command.description}</small></div>{command.shortcut?<kbd dir="ltr">{command.shortcut}</kbd>:<Plus size={13}/>}</button>)}{!commands.length&&<p>مفيش مقطع بالاسم ده. جرّب «قائمة» أو «بطاقة».</p>}</div><footer><span>↑ ↓ اختار · Enter ضيف</span><span>{commands.length} اختيارات · Esc إغلاق</span></footer>
  </div>;}
  function body(block:LessonBlock,index:number,primary=true){return <WriterTextarea register={primary?element=>register(block.id,element):undefined} className={s.paragraph} data-block-body aria-label={`نص المقطع ${index+1}`} aria-expanded={menu?.id===block.id} aria-controls={menu?.id===block.id?`${uid}-commands`:undefined} placeholder={block.type==='heading'?'عنوان يفتح الفكرة…':block.type==='list'||block.type==='checklist'?'اكتب أول عنصر…':block.type==='quote'?'جملة تستاهل تتقال…':block.type==='callout'?'الفكرة اللي عاوز تبرزها…':'اكتب فكرة… أو / لإضافة مقطع'} maxLength={block.type==='heading'?150:3000} rows={1} value={block.body} onChange={e=>write(block.id,e.target.value)} onPaste={e=>paste(e,block.id)} onKeyDown={e=>keys(e,block.id)}/>;}
  function title(block:LessonBlock,index:number,primary=false){return <WriterTextarea register={primary?element=>register(block.id,element):undefined} className={s.title} aria-label={`عنوان الوحدة التفاعلية ${index+1}`} required={!WRITING_TYPES.includes(block.type)} minLength={2} maxLength={150} rows={1} placeholder={block.type==='toggle'?'السؤال أو عنوان المحتوى…':'عنوان الفكرة · اختياري'} value={block.title} onChange={e=>change(block.id,{...block,title:e.target.value})}/>;}
  let valid:LessonBlock[]=[];let error='';if(preview){try{valid=validateLessonBlocks(blocks.filter(b=>b.type!=='paragraph'||b.body.trim()));}catch(err){error=(err as Error).message;}}
  function starter(kind:'explain'|'review'|'example'){
    let next:LessonBlock[];
    if(kind==='example')next=TRAINING_EXPERIENCE.blocks.map(b=>({...structuredClone(b),id:crypto.randomUUID()}));
    else if(kind==='explain')next=[{...newLessonBlock('heading',crypto.randomUUID()),body:'ابدأ من السؤال'},newLessonBlock('paragraph',crypto.randomUUID()),{...newLessonBlock('callout',crypto.randomUUID()),title:'الفكرة الأساسية'}];
    else next=[{...newLessonBlock('heading',crypto.randomUUID()),body:'أهم أفكار الدرس'},newLessonBlock('paragraph',crypto.randomUUID()),newLessonBlock('checklist',crypto.randomUUID())];
    commit(next);focus(next[1]?.id||next[0].id,0);setMessage('اتضاف هيكل البداية. اكتب شرحك وعدّل أي جزء.');
  }
  return <div ref={root} className={`${s.editor} ${integrated?s.integrated:''}`} data-document-editor data-history={revision} onKeyDownCapture={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&!menu){const row=(e.target as Element).closest('[data-block-editor]');if(row){e.preventDefault();e.stopPropagation();addParagraph(blocks.findIndex(b=>`author-block-${b.id}`===row.id));return;}}if((e.ctrlKey||e.metaKey)&&!e.altKey&&!(e.target as Element).closest('[data-command-menu]')){if(e.key.toLowerCase()==='z'&&(e.shiftKey?history.current.future.length:history.current.past.length)){e.preventDefault();e.stopPropagation();e.shiftKey?redo():undo();}else if(e.key.toLowerCase()==='y'&&history.current.future.length){e.preventDefault();e.stopPropagation();redo();}}}}>
    <header className={s.documentToolbar}><div className={s.undoTools}><button type="button" aria-label="تراجع عن تعديل المقاطع" disabled={!history.current.past.length} onClick={undo}><Undo2 size={16}/></button><button type="button" aria-label="إعادة تعديل المقاطع" disabled={!history.current.future.length} onClick={redo}><Redo2 size={16}/></button><span/></div><div className={s.insertTools}><button type="button" data-open-menu onClick={()=>open('tail','',true,'write')}><Type size={14}/><span>كتابة</span></button><button type="button" data-open-menu onClick={()=>open('tail','',true,'interact')}><Sparkles size={14}/><span>تفاعل</span></button><button type="button" data-open-menu onClick={()=>open('tail','',true,'media')}><Link2 size={14}/><span>مراجع</span></button></div><button type="button" className={s.insertButton} aria-label="إضافة مقطع" data-open-menu onClick={()=>open('tail','',true)}><Plus size={14}/><span>إضافة مقطع</span><kbd>/</kbd></button>{!integrated&&<button type="button" className={s.previewButton} onClick={()=>setPreview(!preview)}><Eye size={15}/>{preview?'إغلاق المعاينة الحية':'جرّب معاينة الطالب'}</button>}</header>
    {!preview&&<div className={s.document}>
      {blocks.map((block,index)=>{const writing=WRITING_TYPES.includes(block.type);return <section className={`${s.row} ${block.type!=='paragraph'&&!writing?s.rich:''} ${writing?s.writingRow:''}`} data-block-editor={block.type} id={`author-block-${block.id}`} key={block.id} onDragOver={e=>{if(drag)e.preventDefault();}} onDrop={e=>{e.preventDefault();move(blocks.findIndex(b=>b.id===drag),index);setDrag('');}}>
        <div className={s.blockTools} onClick={e=>{if((e.target as HTMLElement).closest('button'))e.currentTarget.querySelector('details')?.removeAttribute('open');}}><button type="button" data-open-menu aria-label={`أضف بعد المقطع ${index+1}`} onClick={()=>open(block.id,'',true)}><Plus size={15}/></button><span className={s.grip} draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',block.id);setDrag(block.id);}} onDragEnd={()=>setDrag('')} title="اسحب لترتيب المقطع"><GripVertical size={16}/></span><details name={`${uid}-block-tools`}><summary aria-label={`أدوات المقطع ${index+1}`}>⋯</summary><div><button type="button" aria-label={`رفع الوحدة ${index+1}`} disabled={index===0} onClick={()=>move(index,index-1)}><ArrowUp size={14}/>لأعلى</button><button type="button" aria-label={`خفض الوحدة ${index+1}`} disabled={index===blocks.length-1} onClick={()=>move(index,index+1)}><ArrowDown size={14}/>لأسفل</button><button type="button" aria-label={`نسخ الوحدة ${index+1}`} disabled={blocks.length>=64} onClick={()=>{const copy={...structuredClone(block),id:crypto.randomUUID()};commit([...blocks.slice(0,index+1),copy,...blocks.slice(index+1)]);}}><Copy size={14}/>نسخ</button><button type="button" aria-label={`حذف الوحدة ${index+1}`} onClick={()=>remove(index)}><Trash2 size={14}/>حذف</button></div></details></div>
        <div className={s.blockContent}>{block.type==='paragraph'?body(block,index):writing?<LessonWritingFields block={block as WritingBlock} body={body(block,index,!['table','video','resource','toggle'].includes(block.type))} title={title(block,index,block.type==='toggle')} focusRef={element=>register(block.id,element)} onChange={value=>change(block.id,value)}/>:<><div className={s.blockLabel}><span><CommandIcon type={block.type}/>{BLOCK_LABELS[block.type]}</span>{block.type!=='text'&&<button type="button" aria-expanded={expanded.includes(block.id)} onClick={()=>setExpanded(ids=>ids.includes(block.id)?ids.filter(id=>id!==block.id):[...ids,block.id])}>{expanded.includes(block.id)?'طيّ التفاصيل':'تحرير المحتوى'}<ChevronDown size={12}/></button>}</div>{title(block,index,true)}<WriterTextarea className={s.caption} aria-label={`تمهيد الوحدة ${index+1}`} required={block.type==='text'} minLength={block.type==='text'?2:0} maxLength={3000} rows={2} placeholder={block.type==='text'?'اكتب الشرح هنا…':'تمهيد بسيط للتفاعل — اختياري'} value={block.body} onChange={e=>change(block.id,{...block,body:e.target.value})}/>{block.type!=='text'&&(expanded.includes(block.id)?<div className={s.fields}><LessonBlockFields block={block} index={index} onChange={value=>change(block.id,value)}/></div>:<BlockSummary block={block}/>)}</>}{commandMenu(block.id)}</div>
      </section>;})}
      {blocks.length<64&&<section className={s.row}><div className={s.blockTools}><button type="button" data-open-menu aria-label="إضافة مقطع جديد" onClick={()=>open('tail','',true)}><Plus size={16}/></button></div><div className={s.blockContent}>{body({id:'tail',type:'paragraph',title:'',body:''},blocks.length)}{commandMenu('tail')}</div></section>}
      {!blocks.length&&<div className={s.starters}><div className={s.starterHeading}><span>مش لازم تبدأ من صفحة فاضية.</span><small>اختار هيكل وعدّله على طريقتك</small></div><div><button type="button" onClick={()=>starter('explain')}><span className={s.starterLime}><Heading2 size={19}/></span><strong>شرح منظم</strong><small>عنوان، فكرة، وملاحظة مهمة</small></button><button type="button" onClick={()=>starter('review')}><span className={s.starterLilac}><CheckSquare size={19}/></span><strong>ورقة مراجعة</strong><small>خلاصة ونقاط يراجعها الطالب</small></button><button type="button" onClick={()=>starter('example')} aria-label="أضف مثال التدريب التفاعلي"><span className={s.starterPeach}><Sparkles size={19}/></span><strong>مثال تفاعلي</strong><small>تجربة جاهزة تستكشفها وتعدّلها</small></button></div></div>}
    </div>}
    {removed&&!preview&&<div className={s.undo}><span>اتحذف المقطع.</span><button type="button" onClick={undo}><Undo2 size={13}/>تراجع عن الحذف</button></div>}
    <span className={s.status} role="status">{message}</span>{preview&&(error?<p role="alert" className={s.error}>{error}</p>:<div className={s.preview}><LessonBlocks blocks={valid} preview/></div>)}
  </div>;
}
function CommandIcon({type}:{type:BlockType}){const Icon=type==='heading'?Heading2:type==='list'?ListIcon:type==='checklist'?CheckSquare:type==='quote'?Quote:type==='table'?Table2:type==='video'?Play:type==='resource'?Link2:type==='divider'?Minus:type==='paragraph'?AlignRight:type==='text'?Type:Sparkles;return <Icon size={16}/>;}
function BlockSummary({block}:{block:LessonBlock}){if(block.type==='cards')return <div className={s.cards}>{block.cards.map((card,i)=><div key={i}><small>0{i+1}</small><strong>{card.front||'وجه البطاقة'}</strong><p>{card.back||'اكتب المعنى من «تحرير المحتوى»'}</p></div>)}</div>;if(block.type==='quiz')return <div className={s.options}>{block.options.map((option,i)=><div key={i}><span>{['أ','ب','ج'][i]}</span>{option||'اختيار جديد'}{i===block.correctIndex&&<small>الصحيح</small>}</div>)}</div>;return <p className={s.summary}>{LESSON_COMMANDS.find(c=>c.type===block.type)?.description} · اضغط «تحرير المحتوى» لتعديل التفاصيل.</p>;}

function WriterTextarea({register,...props}:TextareaHTMLAttributes<HTMLTextAreaElement>&{register?:(element:HTMLTextAreaElement|null)=>void}){
  const ref=useRef<HTMLTextAreaElement|null>(null);
  function fit(){const element=ref.current;if(!element||!element.getClientRects().length)return;element.style.height='auto';element.style.height=`${element.scrollHeight}px`;}
  useLayoutEffect(fit,[props.value]);
  useEffect(()=>{const element=ref.current;if(!element)return;let width=-1;const observer=new ResizeObserver(entries=>{const next=entries[0].contentRect.width;if(next>0&&next!==width){width=next;fit();}});observer.observe(element);return()=>observer.disconnect();},[]);
  return <textarea {...props} ref={element=>{ref.current=element;register?.(element);}}/>;
}
