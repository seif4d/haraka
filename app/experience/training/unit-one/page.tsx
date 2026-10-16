import Link from "next/link";
import { ArrowLeft, Compass, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/public-site";
import LessonBlocks from "@/components/lesson-blocks";
import { currentUser } from "@/lib/server/auth";
import { platformSettings } from "@/lib/server/platform-settings";
import { validateLessonBlocks } from "@/lib/lesson-blocks";
import { socialMetadata } from "@/lib/social-metadata";
import { homeFor } from "@/lib/domain";
import source from "@/data/training-principles-interactive.json";
import styles from "../page.module.css";
const lesson=source[0];
export function generateMetadata(){return socialMetadata("نفس الجري. حكايتين مختلفتين. — حركة",lesson.intro,"/experience/training/unit-one");}
export default async function UnitOneExperience(){
  const user=await currentUser();const settings=platformSettings();const blocks=validateLessonBlocks(lesson.blocks);
  return <div className="harka-shell"><PublicHeader user={user} registrationOpen={settings.registrationOpen}/><main className={styles.page}>
    <header className={styles.hero}><span className={styles.kicker}><Sparkles size={15}/>من دروس تانية · مبادئ التدريب الرياضي</span><h1>نفس الجري.<br/><span>حكايتين مختلفتين.</span></h1><p>{lesson.intro}</p><a href={`#block-${blocks[0].id}`} className="button primary-button">ابدأ بموقف… مش تعريف<ArrowLeft size={17}/></a><div className={styles.heroFacts}><span><Compass size={15}/>خد قرارك</span><span>حرّك خط الزمن</span><span>صنّف وافهم السبب</span></div><span className={styles.heroMark} aria-hidden="true">↗</span></header>
    <div className={styles.intro}><div><span className="eyebrow">نشأة التدريب الرياضي وتطوره التاريخي</span><h2>إنت جزء من الشرح.</h2></div><p>اختار، قارن، وارجع للتفاصيل الأكاديمية وقت ما تحتاجها. دي معاينة كاملة لأول درس بالأسلوب الجديد؛ التفاعل هنا للتعلم وبدون درجات.</p></div>
    <LessonBlocks blocks={blocks}/>
    <section className={styles.finish}><span className="tiny-label">TAKE THE IDEA WITH YOU</span><h2>الفكرة اللي تاخدها معاك.</h2><p>الحركة قد تتشابه، لكن الغرض والتنظيم والمتابعة يغيّروا معنى الممارسة. ما تحكمش على العملية من شكل التمرين وحده.</p><Link className="button dark-button" href={user?homeFor(user.role):"/login"}>كمّل مسارك في حركة<ArrowLeft size={17}/></Link><Link className="text-button" href="/experience/training">جرّب معمل التدريب</Link></section>
  </main></div>;
}
