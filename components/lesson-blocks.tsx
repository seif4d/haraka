"use client";

import { useId, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, CheckCheck, FlaskConical, Layers3, Pause, Play, RotateCcw, Sparkles, Target } from "lucide-react";
import type { LessonBlock } from "@/lib/lesson-blocks";
import { BLOCK_LABELS } from "@/lib/lesson-blocks";
import styles from "./lesson-blocks.module.css";
import LessonCopy from "./lesson-copy";

export default function LessonBlocks({blocks,preview=false}:{blocks:LessonBlock[];preview?:boolean}) {
  const instance=useId().replace(/:/g,"");
  return <div className={styles.journey}>{blocks.map((block,index)=><section key={block.id} id={`${preview ? `preview-${instance}` : "block"}-${block.id}`} data-lesson-block={block.type} className={`${styles.block} ${block.type==="simulation"?styles.lab:""}`}>
    <div className={styles.kicker}><span>{String(index+1).padStart(2,"0")} / {BLOCK_LABELS[block.type]}</span>{block.type!=="text" && <span><Sparkles size={13}/>دورك تشارك</span>}</div>
    <h2>{block.title}</h2>{block.body && <div className={styles.body}><LessonCopy text={block.body}/></div>}
    {block.type==="explore" && <Explore block={block}/>}
    {block.type==="cards" && <Cards block={block}/>}
    {block.type==="quiz" && <Quiz block={block}/>}
    {block.type==="sequence" && <Sequence block={block}/>}
    {block.type==="simulation" && (block.model==="training-load"?<TrainingLoad/>:<Recovery/>)}
  </section>)}</div>;
}

function Explore({block}:{block:Extract<LessonBlock,{type:"explore"}>}) {
  const uid=useId().replace(/:/g,"");const [active,setActive]=useState(0);
  return <div className={styles.explore}><div className={styles.tabs} role="tablist" aria-label={block.title}>{block.items.map((item,i)=><button type="button" key={i} id={`${uid}-tab-${i}`} role="tab" aria-selected={active===i} aria-controls={`${uid}-panel`} tabIndex={active===i?0:-1} onClick={()=>setActive(i)} onKeyDown={event=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?block.items.length-1:(active+(event.key==="ArrowLeft"?1:-1)+block.items.length)%block.items.length;setActive(next);document.getElementById(`${uid}-tab-${next}`)?.focus();}}}><span>{String(i+1).padStart(2,"0")}</span>{item.title}</button>)}</div><div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${active}`} className={styles.explorePanel}><div className={styles.orbit} aria-hidden="true"><span>{String(active+1).padStart(2,"0")}</span><i/><i/></div><div key={active} className={styles.enter}><h3>{block.items[active].title}</h3><div style={{fontSize:12}}><LessonCopy text={block.items[active].body}/></div></div></div></div>;
}

function Cards({block}:{block:Extract<LessonBlock,{type:"cards"}>}) {
  const uid=useId().replace(/:/g,"");const [open,setOpen]=useState<number[]>([]);
  return <><p className={styles.instruction}>فكّر في المعنى، وبعدها افتح البطاقة.</p><div className={styles.cards}>{block.cards.map((card,i)=>{const revealed=open.includes(i);return <button type="button" key={i} aria-expanded={revealed} aria-controls={`${uid}-card-${i}`} className={revealed?styles.cardOpen:""} onClick={()=>setOpen(previous=>revealed?previous.filter(n=>n!==i):[...previous,i])}><span className={styles.cardNumber}>0{i+1}<RotateCcw size={15}/></span><strong>{card.front}</strong><span id={`${uid}-card-${i}`} className={styles.cardAnswer} hidden={!revealed}>{card.back}</span><small>{revealed?"اقفل البطاقة":"اكشف الفكرة ↗"}</small></button>;})}</div></>;
}

function Quiz({block}:{block:Extract<LessonBlock,{type:"quiz"}>}) {
  const [choice,setChoice]=useState<number|null>(null);const [checked,setChecked]=useState(false);const correct=choice===block.correctIndex;
  return <div className={styles.quiz}><div role="group" aria-label={`اختيارات: ${block.title}`} className={styles.options}>{block.options.map((option,i)=><button type="button" key={i} aria-pressed={choice===i} className={choice===i?(checked?(correct?styles.correct:styles.incorrect):styles.selected):""} onClick={()=>{setChoice(i);setChecked(false);}}><span>{["أ","ب","ج"][i]}</span>{option}{checked&&choice===i&&correct&&<Check size={18}/>}</button>)}</div><button className="button dark-button" type="button" disabled={choice===null} onClick={()=>setChecked(true)}><Target size={16}/>اختبر قرارك</button>{checked&&<div role="status" className={`${styles.feedback} ${correct?styles.good:""}`}><strong>{correct?"قرار في مكانه!":"خلّينا نفهم السبب ونحاول تاني."}</strong><p>{block.explanation}</p></div>}<small className={styles.instruction}>تدريب على الفهم · بدون درجات</small></div>;
}

function Sequence({block}:{block:Extract<LessonBlock,{type:"sequence"}>}) {
  const initial=()=>block.steps.map((_,i)=>(i+1)%block.steps.length);
  const [order,setOrder]=useState(initial);const [checked,setChecked]=useState(false);const correct=order.every((value,i)=>value===i);
  function move(from:number,to:number){setOrder(previous=>{const next=[...previous];[next[from],next[to]]=[next[to],next[from]];return next;});setChecked(false);}
  return <div className={styles.sequence}><p className={styles.instruction}>استخدم السهمين لترتيب الخطوات، وبعدها راجع منطقك.</p><ol>{order.map((value,i)=><li key={value}><span className={styles.stepIndex}>{i+1}</span><span>{block.steps[value]}</span><div><button type="button" aria-label={`حرّك ${block.steps[value]} لأعلى`} disabled={i===0} onClick={()=>move(i,i-1)}><ArrowUp size={17}/></button><button type="button" aria-label={`حرّك ${block.steps[value]} لأسفل`} disabled={i===order.length-1} onClick={()=>move(i,i+1)}><ArrowDown size={17}/></button></div></li>)}</ol><div className={styles.actions}><button type="button" className="button dark-button" onClick={()=>setChecked(true)}><CheckCheck size={16}/>راجع الترتيب</button><button type="button" className="button outline-button" onClick={()=>{setOrder(initial());setChecked(false);}}><RotateCcw size={15}/>ابدأ تاني</button></div>{checked&&<div role="status" className={`${styles.feedback} ${correct?styles.good:""}`}><strong>{correct?"كل خطوة في مكانها.":"الترتيب محتاج مراجعة."}</strong><p>{correct?block.explanation:"راجع: إيه اللي لازم يحصل قبل الخطوة اللي بعدها؟ حرّك الخطوات وجرّب تاني."}</p></div>}</div>;
}

function TrainingLoad() {
  const [weight,setWeight]=useState(20),[reps,setReps]=useState(8),[sets,setSets]=useState(3),[running,setRunning]=useState(false);
  const volume=weight*reps*sets;const baseline=20*8*3;
  return <div className={styles.simulation} data-simulation="training-load"><div className={styles.simLayout}><div className={styles.controls}>
    <Range label="المقاومة" value={weight} min={5} max={60} step={5} unit="كجم" onChange={setWeight}/><Range label="التكرارات" value={reps} min={1} max={20} unit="تكرار" onChange={setReps}/><Range label="المجموعات" value={sets} min={1} max={6} unit="مجموعة" onChange={setSets}/>
    <div className={styles.actions}><button type="button" className="button dark-button" aria-pressed={running} onClick={()=>setRunning(!running)}>{running?<Pause size={15}/>:<Play size={15}/>} {running?"وقف الحركة":"شوف الحركة"}</button><button type="button" className="button outline-button" aria-label="إعادة ضبط معمل الحمل" onClick={()=>{setWeight(20);setReps(8);setSets(3);setRunning(false);}}><RotateCcw size={16}/></button></div>
  </div><div className={styles.visual}><div className={`${styles.barbell} ${running?styles.lifting:""}`} style={{"--plate":`${16+weight/2}px`, "--speed":`${2.6-reps/12}s`} as React.CSSProperties} aria-hidden="true"><i/><b/><i/></div><div className={styles.repetitions} aria-hidden="true">{Array.from({length:reps},(_,i)=><span key={i}/>)}</div><div className={styles.volume} aria-live="polite" aria-atomic="true"><small>الحجم الحسابي في المثال</small><strong>{volume.toLocaleString("ar-EG")}<span> كجم × تكرار</span></strong></div><div className={styles.meter} aria-hidden="true"><span style={{width:`${volume/7200*100}%`}}/></div></div></div>
    <div className={styles.equation} dir="ltr">{weight} kg × {reps} reps × {sets} sets = {volume} kg·reps</div><div className={styles.observation}><FlaskConical size={19}/><p>{volume===baseline?"ابدأ بتغيير متغير واحد. إيه اللي بيحصل للكمية الكلية؟":`الكمية ${volume>baseline?"زادت":"قلت"} عن نقطة البداية بمقدار ${Math.abs(volume-baseline).toLocaleString("ar-EG")} كجم × تكرار. ثبّت متغيرين وجرّب الثالث.`}</p></div><small className={styles.instruction}>الحاصل يصف كمية العمل في هذا المثال. سرعة الرسم للتوضيح، ولا تقيس استجابة الجسم أو تحدّد برنامجًا تدريبيًا.</small>
  </div>;
}

function Range({label,value,min,max,step=1,unit,onChange}:{label:string;value:number;min:number;max:number;step?:number;unit:string;onChange:(value:number)=>void}){
  return <label className={styles.range}><span>{label}<output>{value} <small>{unit}</small></output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={event=>onChange(Number(event.target.value))}/></label>;
}

const RECOVERY=[
  {name:"حمل بعد استشفاء",path:"M30 145 C80 145 95 210 135 210 S195 90 245 90 S300 145 350 145 S400 180 445 180 S505 60 570 60",dot:[245,90],title:"نفهم العلاقة بين المجهود والاستشفاء",body:"الرسم يصوّر هبوطًا بعد المجهود، ثم استشفاءً وتحسنًا محتملًا. موضع الحمل التالي هو محور المقارنة، وليس عدد ساعات ثابتًا لكل الرياضيين."},
  {name:"تكرار الحمل مبكرًا",path:"M30 145 C80 145 95 210 135 210 S175 155 205 155 S245 245 300 245 S355 205 390 205 S455 270 570 270",dot:[205,155],title:"ماذا لو تكرر الحمل قبل اكتمال الاستشفاء؟",body:"هنا نغيّر توقيت الحمل التالي لنفكّر في تراكم التعب. نفس العمل الخارجي قد يتبعه مسار مختلف؛ اقرأ السياق قبل الحكم على البرنامج."},
  {name:"فاصل طويل بين الأحمال",path:"M30 145 C80 145 95 210 135 210 S195 90 245 90 S360 145 420 145 S480 150 570 150",dot:[420,145],title:"ماذا لو امتد الفاصل بين الأحمال؟",body:"الرسم يعيد المستوى تدريجيًا قرب خط البداية. الفكرة هنا هي دور الاستمرارية، وليس افتراض وقت محدد تختفي بعده مكاسب كل رياضي."},
];
function Recovery(){const gradient=useId().replace(/:/g,"");const [active,setActive]=useState(0);const scenario=RECOVERY[active];return <div className={styles.recovery} data-simulation="recovery"><div className={styles.scenarios} role="group" aria-label="سيناريوهات الاستشفاء">{RECOVERY.map((item,i)=><button type="button" key={item.name} aria-pressed={active===i} onClick={()=>setActive(i)}>{item.name}</button>)}</div><svg viewBox="0 0 600 310" role="img" aria-label={`مخطط توضيحي: ${scenario.name}`}><defs><linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1"><stop stopColor="currentColor" stopOpacity=".2"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs><path d="M30 35 V285 H580" className={styles.axis}/><path d="M30 145 H580" className={styles.baseline}/><path key={`${active}-fill`} d={`${scenario.path} L570 285 L30 285 Z`} fill={`url(#${gradient})`}/><path key={active} d={scenario.path} className={styles.curve}/><circle cx={scenario.dot[0]} cy={scenario.dot[1]} r="8" className={styles.chartDot}/></svg><div className={styles.chartLabels}><span>مستوى الأداء النسبي ↑</span><span>الزمن النسبي</span></div><div className={styles.feedback} key={active} role="status"><strong>{scenario.title}</strong><p>{scenario.body}</p></div><small className={styles.instruction}>نموذج مفاهيمي للمقارنة؛ المحاور بلا قيم قياس، وليست توقعًا فسيولوجيًا أو توصية بموعد تدريب.</small></div>;}
