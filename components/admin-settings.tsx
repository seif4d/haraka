"use client";

import { useState } from "react";
import { ArrowUpLeft, Check, Globe2, LockKeyhole, Megaphone, Save, ShieldCheck, UserRound, Users } from "lucide-react";
import { api } from "@/lib/client-api";
import type { User } from "@/lib/domain";
import type { PlatformSettings } from "@/lib/platform-settings";
import styles from "./admin-settings.module.css";

export default function AdminSettings({ initial, user, onReload }: { initial: PlatformSettings; user: User; onReload: () => Promise<void> }) {
  const [tab, setTab] = useState<"platform" | "account">("platform");
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  function patch<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setDraft(previous => ({...previous, [key]: value})); setMessage(""); setError("");
  }
  return <section className={styles.settings}>
    <div className={styles.summary}><span className={styles.summaryIcon}><Globe2 size={28}/></span><div><span className="tiny-label">MAKE IT YOURS</span><h2>تفاصيل صغيرة. تجربة أحسن.</h2><p>ظبّط باب الدخول، صوت المنصة، وطريقة الوصول ليك.</p></div><a href="/" target="_blank" rel="noreferrer" className="button outline-button">عاين المنصة <ArrowUpLeft size={16}/></a></div>
    <div className={styles.tabs} role="tablist" aria-label="أقسام الإعدادات">{([{id:"platform", title:"إعدادات المنصة", icon:Globe2}, {id:"account", title:"حسابي والأمان", icon:ShieldCheck}] as const).map(item => <button type="button" key={item.id} role="tab" aria-label={item.title} id={`tab-${item.id}`} aria-selected={tab===item.id} aria-controls={`panel-${item.id}`} tabIndex={tab===item.id ? 0 : -1} onKeyDown={event=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(event.key)){event.preventDefault();const next=event.key==="Home"?"platform":event.key==="End"?"account":tab==="platform"?"account":"platform";setTab(next);document.getElementById(`tab-${next}`)?.focus();}}} onClick={()=>setTab(item.id)}><item.icon size={18}/>{item.title}{item.id==="platform" && dirty && <i aria-label="تغييرات غير محفوظة"/>}</button>)}</div>
    <div role="tabpanel" id="panel-platform" aria-labelledby="tab-platform" hidden={tab!=="platform"}>
      <form onSubmit={async event => {
        event.preventDefault(); if(busy || !dirty) return; setBusy(true);setError("");setMessage("");
        try {const result=await api<PlatformSettings>("admin/settings", draft, "PATCH");setSaved(result);setDraft(result);setMessage("اتحفظت الإعدادات واتطبّقت على المنصة.");}
        catch(err){setError(err instanceof Error ? err.message : "تعذر الحفظ.");} finally {setBusy(false);}
      }}>
        <fieldset disabled={busy} className={styles.fields}>
          <article className={styles.card}><div className={styles.cardTitle}><span className="mini-icon lilac"><Globe2 size={22}/></span><div><span>01 / الصفحة العامة</span><h3>أول انطباع، بصوتك.</h3></div></div><label className="field-label">عنوان الصفحة<input aria-label="عنوان الصفحة" required minLength={2} maxLength={100} value={draft.pageTitle} onChange={e=>patch("pageTitle",e.target.value)}/><small>يظهر في تبويب المتصفح ونتائج البحث للصفحة الرئيسية.</small></label><label className="field-label">وصف المنصة<textarea aria-label="وصف المنصة" required rows={3} minLength={10} maxLength={350} value={draft.description} onChange={e=>patch("description",e.target.value)}/><small>المقدمة تحت العنوان الرئيسي، ووصف الصفحة عند مشاركتها.</small></label><label className="field-label">بريد التواصل <span>اختياري</span><input aria-label="بريد التواصل" type="email" maxLength={254} dir="ltr" placeholder="hello@example.com" value={draft.supportEmail} onChange={e=>patch("supportEmail",e.target.value)}/><small>يظهر كرابط تواصل في أسفل الصفحة العامة.</small></label></article>
          <div className={styles.stack}><article className={styles.card}><div className={styles.cardTitle}><span className="mini-icon lime"><Users size={22}/></span><div><span>02 / باب الدخول</span><h3>جاهزين لطلاب جدد؟</h3></div></div><label className={styles.toggle}><span><strong>استقبال حسابات جديدة</strong><small>{draft.registrationOpen ? "التسجيل متاح للطلاب." : "التسجيل متوقف. الحسابات الحالية تقدر تدخل كالمعتاد."}</small></span><input type="checkbox" role="switch" checked={draft.registrationOpen} onChange={e=>patch("registrationOpen",e.target.checked)}/></label><div className={styles.hint}><ShieldCheck size={17}/><p>التسجيل العام ينشئ حساب طالب فقط. صلاحيات الإدارة تفضل محمية.</p></div></article>
          <article className={styles.card}><div className={styles.cardTitle}><span className="mini-icon peach"><Megaphone size={22}/></span><div><span>03 / صوت المنصة</span><h3>رسالة توصل للكل.</h3></div></div><label className={styles.toggle}><span><strong>إظهار إعلان عام</strong><small>يظهر في الصفحة العامة ومساحة الطالب.</small></span><input type="checkbox" role="switch" checked={draft.announcementEnabled} onChange={e=>patch("announcementEnabled",e.target.checked)}/></label><label className="field-label">نص الإعلان<textarea required={draft.announcementEnabled} maxLength={400} rows={3} placeholder="مثال: ملخصات الأسبوع الجديد متاحة في المكتبة ✨" value={draft.announcement} onChange={e=>patch("announcement",e.target.value)}/></label>{draft.announcementEnabled && draft.announcement && <div className={styles.preview}><span>معاينة الإعلان</span><p><Megaphone size={17}/>{draft.announcement}</p></div>}</article></div>
        </fieldset>
        <div className={styles.savebar}><div aria-live="polite">{error ? <p className="form-error" role="alert">{error}</p> : message ? <p className={styles.success}><Check size={17}/>{message}</p> : <p>{dirty ? "عندك تغييرات لسه متحفظتش." : "كل حاجة محفوظة. عدّل اللي يناسبك."}</p>}</div><div className={styles.saveActions}><button type="button" className="button outline-button" disabled={!dirty || busy} onClick={()=>{setDraft(saved);setError("");setMessage("");}}>تراجع عن التغييرات</button><button className="button primary-button" type="submit" disabled={!dirty || busy}><Save size={17}/>{busy ? "جاري الحفظ…" : "حفظ الإعدادات"}</button></div></div>
      </form>
    </div>
    <div role="tabpanel" id="panel-account" aria-labelledby="tab-account" hidden={tab!=="account"}><AccountSettings user={user} onReload={onReload}/></div>
  </section>;
}


function AccountSettings({user,onReload}:{user:User;onReload:()=>Promise<void>}) {
  const [name,setName]=useState(user.profile.name);
  const [busy,setBusy]=useState<"name"|"password"|null>(null);
  const [notice,setNotice]=useState<{kind:"name"|"password";error:boolean;text:string}|null>(null);
  return <div className={styles.fields}>
    <form className={styles.card} onSubmit={async event=>{event.preventDefault();if(busy)return;setBusy("name");setNotice(null);try{const result=await api<{name:string}>("admin/account",{name},"PATCH");setName(result.name);await onReload();setNotice({kind:"name",error:false,text:"اتحفظ اسم حسابك."});}catch(err){setNotice({kind:"name",error:true,text:err instanceof Error?err.message:"تعذر الحفظ."});}finally{setBusy(null);}}}>
      <div className={styles.cardTitle}><span className="mini-icon blue"><UserRound size={22}/></span><div><span>حساب الإدارة</span><h3>الاسم اللي بيظهر ليك.</h3></div></div><label className="field-label">اسم المدير<input required minLength={2} maxLength={50} value={name} onChange={e=>setName(e.target.value)}/></label><label className="field-label">بريد تسجيل الدخول<input type="email" dir="ltr" readOnly value={user.email}/></label><p className={styles.hint}>صلاحية الحساب: مدير المنصة.</p><AccountNotice kind="name" notice={notice}/><button type="submit" className="button dark-button" disabled={!!busy || name.trim()===user.profile.name}><Save size={17}/>{busy==="name"?"جاري الحفظ…":"حفظ بياناتي"}</button>
    </form>
    <form className={styles.card} onSubmit={async event=>{event.preventDefault();if(busy)return;const form=event.currentTarget;const fields=Object.fromEntries(new FormData(form));setBusy("password");setNotice(null);try{await api("admin/password",fields);form.reset();setNotice({kind:"password",error:false,text:"اتغيّرت كلمة المرور. خرجنا حسابك من الأجهزة التانية، وجلسة الجهاز ده مستمرة."});}catch(err){setNotice({kind:"password",error:true,text:err instanceof Error?err.message:"تعذر التغيير."});}finally{setBusy(null);}}}>
      <div className={styles.cardTitle}><span className="mini-icon lilac"><LockKeyhole size={22}/></span><div><span>الأمان</span><h3>مفتاح مساحتك.</h3></div></div><input type="text" name="username" autoComplete="username" value={user.email} readOnly hidden/><label className="field-label">كلمة المرور الحالية<input required type="password" name="currentPassword" maxLength={128} autoComplete="current-password"/></label><label className="field-label">كلمة المرور الجديدة<input required type="password" name="newPassword" aria-label="كلمة المرور الجديدة" minLength={10} maxLength={128} autoComplete="new-password"/><small>10 أحرف على الأقل. اختار كلمة مختلفة عن الحالية.</small></label><label className="field-label">تأكيد كلمة المرور الجديدة<input required type="password" name="confirmPassword" minLength={10} maxLength={128} autoComplete="new-password"/></label><AccountNotice kind="password" notice={notice}/><button type="submit" className="button dark-button" disabled={!!busy}><ShieldCheck size={17}/>{busy==="password"?"جاري التغيير…":"تغيير كلمة المرور"}</button>
    </form>
  </div>;
}
function AccountNotice({kind,notice}:{kind:string;notice:{kind:string;error:boolean;text:string}|null}){return notice?.kind===kind ? <p role={notice.error?"alert":"status"} className={notice.error?"form-error":styles.success}>{notice.text}</p> : null;}
