"use client";
import { useState } from "react";
import { ArrowLeft, Check, GraduationCap, Settings2 } from "lucide-react";
import { normalizeProfile, type Profile } from "@/lib/curriculum";
import { specializationSlots, type Specializations } from "@/lib/specializations";
import type { StudentData } from "@/lib/domain";
import { ProfileFilters } from "./profile-filters";
import { SpecializationFields } from "./specialization-fields";
export default function StudentSettings({data,onSave}:{data:StudentData;onSave:(profile:Profile,choices:Specializations)=>Promise<boolean>}) {
  const [draft,setDraft]=useState(data.profile);const [choices,setChoices]=useState(data.specializations);
  const [busy,setBusy]=useState(false);const [saved,setSaved]=useState(false);
  return <><div className="page-heading"><p className="eyebrow"><Settings2 size={15}/>حسابك، على مقاسك</p><h1>إعداداتك في مكان واحد.</h1><p className="muted">مسارك اللي اخترته وقت التسجيل هو أساس موادك وجدولك. عدّله هنا لو احتجت.</p></div><section className="student-settings-panel"><div className="settings-title"><span className="mini-icon lilac"><GraduationCap size={23}/></span><div><h2>الملف الدراسي</h2><p>التغييرات تُحفظ في حسابك.</p></div></div><form onChange={()=>setSaved(false)} onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);const current=Object.fromEntries(specializationSlots(draft).map(c=>[c.id,choices[c.id] || ""]));try {setSaved(await onSave(draft,current));}finally{setBusy(false);}}}><label className="field-label">اسمك<input name="studentName" required minLength={2} maxLength={50} disabled={busy} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label className="field-label">البريد الإلكتروني<input type="email" readOnly value={data.email} dir="ltr"/><small>البريد المرتبط بحسابك.</small></label><ProfileFilters studentGroups disabled={busy} profile={draft} onChange={patch=>setDraft(normalizeProfile({...draft,...patch}))}/><SpecializationFields profile={draft} choices={choices} disabled={busy} onChange={(id,sport)=>setChoices({...choices,[id]:sport})}/><div className="settings-actions"><button type="submit" disabled={busy} className="button dark-button">{busy ? "جاري الحفظ…" : "حفظ إعداداتي"}<ArrowLeft size={17}/></button>{saved && <span className="settings-saved" role="status"><Check size={17}/>اتحفظت إعداداتك.</span>}</div></form></section></>;
}
