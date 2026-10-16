"use client";
import { useEffect, useState } from "react";
import type { LessonBlock } from "@/lib/lesson-blocks";
import s from "./lesson-journey.module.css";
export default function LessonJourney({blocks}:{blocks:LessonBlock[]}){
  const stages=[{label:"خد قرارك",block:blocks.find(b=>b.type==='story')},{label:"افهم وجرّب",block:blocks.find(b=>['timeline','map','lab'].includes(b.type))},{label:"طبّق الفكرة",block:blocks.find(b=>b.type==='sort')},{label:"تعمّق",block:blocks.find(b=>b.type==='reading')}].filter(v=>v.block);
  const [active,setActive]=useState(0);const ids=stages.map(v=>v.block!.id).join('|');
  useEffect(()=>{const elements=ids.split('|').map(id=>document.getElementById(`block-${id}`)).filter((e):e is HTMLElement=>!!e);function update(){let index=0;for(let i=0;i<elements.length;i++)if(elements[i].getBoundingClientRect().top<190)index=i;setActive(index);}update();addEventListener('scroll',update,{passive:true});return()=>removeEventListener('scroll',update);},[ids]);
  return <nav className={s.trail} aria-label="رحلة الدرس">{stages.map((stage,i)=><a href={`#block-${stage.block!.id}`} key={stage.block!.id} aria-current={active===i?'location':undefined}><span>{String(i+1).padStart(2,'0')}</span>{stage.label}</a>)}</nav>;
}
