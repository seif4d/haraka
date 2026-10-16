import Link from "next/link";
import { ArrowLeft, FlaskConical, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/public-site";
import LessonBlocks from "@/components/lesson-blocks";
import { currentUser } from "@/lib/server/auth";
import { platformSettings } from "@/lib/server/platform-settings";
import { TRAINING_EXPERIENCE } from "@/lib/training-experience";
import { homeFor } from "@/lib/domain";
import { socialMetadata } from "@/lib/social-metadata";
import styles from "./page.module.css";

export function generateMetadata(){return socialMetadata("جرّب تتعلّم بالحركة — حركة",TRAINING_EXPERIENCE.intro,"/experience/training");}
export default async function TrainingExperiencePage(){
  const user=await currentUser();const settings=platformSettings();
  return <div className="harka-shell"><PublicHeader user={user} registrationOpen={settings.registrationOpen}/><main className={styles.page}>
    <header className={styles.hero}><span className={styles.kicker}><Sparkles size={15}/>تجربة مفتوحة · مبادئ التدريب الرياضي</span><h1>الفكرة مش هتثبت<br/>غير لما <span>تشارك فيها.</span></h1><p>{TRAINING_EXPERIENCE.intro}</p><a href="#block-training-start" className="button primary-button">ادخل التجربة <ArrowLeft size={17}/></a><div className={styles.heroFacts}><span><FlaskConical size={15}/>غيّر المتغيرات</span><span>اختبر قرارك</span><span>ارجع وافهم السبب</span></div><span className={styles.heroMark} aria-hidden="true">↗</span></header>
    <div className={styles.intro}><div><span className="eyebrow">من تمرين عشوائي لخطة لها معنى</span><h2>٧ خطوات. وإنت جزء من الشرح.</h2></div><p>ابدأ بالسؤال، واستكشف الأفكار، وجرّب الحساب. تقدر تعيد كل نشاط وتراجع تفسيره في وقتك.</p></div>
    <LessonBlocks blocks={TRAINING_EXPERIENCE.blocks}/>
    <section className={styles.finish}><span className="tiny-label">YOUR NEXT MOVE</span><h2>الفهم بيكبر لما تجرّبه.</h2><p>دي تجربة قصيرة من شكل الدروس في حركة. ادخل مساحتك عشان تلاقي محتوى مسارك والمواد المتاحة ليك.</p><Link className="button dark-button" href={user?homeFor(user.role):settings.registrationOpen?"/register":"/login"}>{user?"افتح مساحتك":settings.registrationOpen?"ابدأ رحلتك":"ادخل لحسابك"}<ArrowLeft size={17}/></Link><Link className="text-button" href="/">ارجع للصفحة الرئيسية</Link></section>
  </main></div>;
}
