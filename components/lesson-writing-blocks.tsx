"use client";
import { useState } from "react";
import { ArrowUpLeft, Check, ChevronDown, CircleAlert, FileText, Lightbulb, Play, Quote, Sparkles } from "lucide-react";
import type { LessonBlock } from "@/lib/lesson-blocks";
import { lessonLink, lessonVideoId } from "@/lib/lesson-links";
import LessonCopy from "./lesson-copy";
import s from "./lesson-writing-blocks.module.css";

export default function LessonWritingBlock({block}:{block:LessonBlock}){
  if(block.type==='heading')return block.level===3?<h3 className={s.h3}>{block.body}</h3>:<h2 className={s.h2}>{block.body}</h2>;
  if(block.type==='divider')return <div className={s.divider}><span/><Sparkles size={14}/><span/></div>;
  if(block.type==='list'){const items=block.body.split('\n').filter(line=>line.trim());const rows=items.map((line,i)=><li key={i}>{line}</li>);return <div className={s.list}>{block.title&&<h3>{block.title}</h3>}{block.style==='number'?<ol>{rows}</ol>:<ul>{rows}</ul>}</div>;}
  if(block.type==='checklist')return <Checklist key={block.body} block={block}/>;
  if(block.type==='callout'){const Icon=block.tone==='warning'?CircleAlert:block.tone==='success'?Check:block.tone==='idea'?Lightbulb:Sparkles;return <aside className={`${s.callout} ${s[block.tone]}`}><span className={s.calloutIcon}><Icon size={20}/></span><div>{block.title&&<h3>{block.title}</h3>}<LessonCopy text={block.body}/></div></aside>;}
  if(block.type==='quote')return <figure className={s.quote}><Quote size={25}/><blockquote><LessonCopy text={block.body}/></blockquote>{block.attribution&&<figcaption>— {block.attribution}</figcaption>}</figure>;
  if(block.type==='toggle')return <details className={s.toggle}><summary><span>{block.title}</span><ChevronDown size={18}/></summary><div><LessonCopy text={block.body}/></div></details>;
  if(block.type==='table')return <figure className={s.table}>{block.title&&<figcaption>{block.title}</figcaption>}<div tabIndex={0} role="region" aria-label={block.title||'جدول الدرس'}><table><thead><tr>{block.headers.map((head,i)=><th scope="col" key={i}>{head}</th>)}</tr></thead><tbody>{block.rows.map((row,i)=><tr key={i}>{row.map((cell,n)=><td key={n}>{cell}</td>)}</tr>)}</tbody></table></div>{block.body&&<p>{block.body}</p>}</figure>;
  if(block.type==='video')return <Video key={block.url} block={block}/>;
  if(block.type==='resource'){const url=lessonLink(block.url);return <a className={s.resource} href={url||undefined} target="_blank" rel="noopener noreferrer"><span className={s.resourceIcon}><FileText size={23}/></span><div><small>كمّل الفكرة من المصدر</small><h3>{block.title||'افتح المرجع'}</h3>{block.body&&<p>{block.body}</p>}<span dir="ltr">{url?new URL(url).hostname:''}</span></div><ArrowUpLeft size={21}/></a>;}
  return null;
}
function Checklist({block}:{block:Extract<LessonBlock,{type:'checklist'}>}){const [checked,setChecked]=useState<number[]>([]);const items=block.body.split('\n').filter(line=>line.trim());return <section className={s.checklist}>{block.title&&<h3>{block.title}</h3>}<div className={s.checklistMeta}><span>راجع فهمك، خطوة بخطوة</span><strong dir="ltr">{checked.length} / {items.length}</strong></div>{items.map((line,i)=><label key={i} className={checked.includes(i)?s.checked:''}><input type="checkbox" checked={checked.includes(i)} onChange={e=>setChecked(previous=>e.target.checked?[...previous,i]:previous.filter(n=>n!==i))}/><span>{line}</span></label>)}<small>متابعة شخصية داخل الصفحة · بدون درجات</small></section>;}
function Video({block}:{block:Extract<LessonBlock,{type:'video'}>}){const [playing,setPlaying]=useState(false);const id=lessonVideoId(block.url);return <figure className={s.video}>{block.title&&<figcaption>{block.title}</figcaption>}<div>{playing&&id?<iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={block.title||'فيديو الدرس'} allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen/>:<button type="button" disabled={!id} onClick={()=>setPlaying(true)}><span><Play size={24} fill="currentColor"/></span><strong>شوف الفكرة وهي بتتحرّك.</strong><small>تشغيل فيديو YouTube</small></button>}</div>{block.body&&<p>{block.body}</p>}</figure>;}
