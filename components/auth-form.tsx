"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, GraduationCap, ShieldCheck } from "lucide-react";
import { api } from "@/lib/client-api";
import { DEFAULT_PROFILE, normalizeProfile, type Profile } from "@/lib/curriculum";
import { SpecializationFields } from "./specialization-fields";
import { specializationSlots, type Specializations } from "@/lib/specializations";
import { ProfileFilters } from "./profile-filters";

export default function AuthForm({ mode, needsSetupToken=false, registrationOpen=true }: { mode: "login" | "register" | "setup"; needsSetupToken?:boolean; registrationOpen?:boolean }) {
  const [profile, setProfile] = useState<Profile>({ ...DEFAULT_PROFILE, year: 1, track: "general" });
  const [choices,setChoices]=useState<Specializations>({});
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  const login = mode === "login"; const setup = mode === "setup";
  return <div className="auth-card"><span className={`mini-icon ${setup ? "lilac" : "lime"}`}>{setup ? <ShieldCheck size={24}/> : <GraduationCap size={24}/>}</span><p className="eyebrow">{setup ? "للمالك · خطوة واحدة عند البداية" : login ? "رجعت؟ نكمّل من مكانك." : "حسابك، بداية حركتك"}</p><h1>{setup ? "جهّز مساحة الإدارة." : login ? "أهلًا برجوعك." : "خلّي الفهم عادة."}</h1><p className="muted">{setup ? "أنشئ أول حساب إدارة. بعد الإعداد، يُغلق هذا المسار ويبدأ تسجيل الطلاب." : login ? "ادخل حسابك وارجع لموادك ورحلتك." : "اختار مسارك الدراسي، ونجهّز لك مساحتك."}</p><form onSubmit={async event => {
    event.preventDefault(); if(busy) return; setBusy(true); setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try { const result = await api<{redirect:string}>(`auth/${mode}`, { ...fields, profile, specializations:Object.fromEntries(specializationSlots(profile).filter(c=>choices[c.id]).map(c=>[c.id,choices[c.id]])) }); window.location.assign(result.redirect); }
    catch (err) { setError(err instanceof Error ? err.message : "تعذر الاتصال بالخادم."); setBusy(false); }
  }}>
    {!login && <label className="field-label">الاسم<input name="name" required minLength={2} maxLength={50} autoComplete="name" placeholder="نحب نناديك بإيه؟"/></label>}
    <label className="field-label">البريد الإلكتروني<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com" dir="ltr"/></label>
    <label className="field-label">كلمة المرور<div className="password-field"><input name="password" type={show ? "text" : "password"} required minLength={login ? 1 : 10} maxLength={128} autoComplete={login ? "current-password" : "new-password"} dir="ltr"/><button className="icon-button" type="button" aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} onClick={()=>setShow(!show)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>{!login && <small>10 أحرف على الأقل. استخدم كلمة مرور خاصة بك.</small>}</label>
    {!login && <label className="field-label">تأكيد كلمة المرور<input name="confirmPassword" type={show ? "text" : "password"} required minLength={10} maxLength={128} autoComplete="new-password" dir="ltr"/></label>}
    {setup && needsSetupToken && <label className="field-label">رمز إعداد الإدارة<input name="setupToken" type="password" required minLength={32} maxLength={256} autoComplete="off" dir="ltr"/><small>الرمز الخاص اللي حددته في إعدادات تشغيل المنصة.</small></label>}
    {!login && !setup && <fieldset className="auth-path"><legend>مسارك الدراسي</legend><ProfileFilters profile={profile} onChange={patch=>setProfile(normalizeProfile({...profile,...patch}))}/></fieldset>}
    {!login && !setup && <SpecializationFields profile={profile} choices={choices} onChange={(id,sport)=>setChoices({...choices,[id]:sport})}/>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button dark-button full-width" type="submit" disabled={busy}>{busy ? "لحظة، بنجهّز مساحتك…" : setup ? "إنشاء حساب الإدارة" : login ? "ادخل مساحتك" : "أنشئ حسابي"}<ArrowLeft size={17}/></button>
    {(!login || registrationOpen) && <p className="auth-switch">{login ? <>لسه معندكش حساب؟ <Link href="/register">ابدأ من هنا</Link></> : !setup ? <>عندك حساب؟ <Link href="/login">سجّل دخولك</Link></> : <>ده حساب إدارة، تسجيل الطلاب له <Link href="/register">مسار منفصل</Link>.</>}</p>}
    {login && <small className="form-note">لو نسيت كلمة المرور، استعادتها غير متاحة في النسخة الحالية.</small>}
  </form></div>;
}
