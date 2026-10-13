import "server-only";
import type { Profile } from "../curriculum";
import { specializationSlots, sportsFor, type Specializations } from "../specializations";
import { db } from "./db";
export function validateChoices(value:unknown, profile:Profile):Specializations {
  if(value===undefined) return {};
  if(!value || typeof value!=="object" || Array.isArray(value)) throw new Error("اختيارات التخصص غير صالحة.");
  const slots=specializationSlots(profile); const result:Specializations={};
  for(const [courseId,sportId] of Object.entries(value)) {
    const slot=slots.find(c=>c.id===courseId);
    if(!slot || typeof sportId!=="string" || (sportId && !sportsFor(slot).some(s=>s.id===sportId))) throw new Error("اختار رياضة متاحة لمقرر في مسارك الحالي.");
    result[courseId]=sportId;
  }
  return result;
}
export function saveChoices(userId:string, choices:Specializations) {
  for(const [courseId,sportId] of Object.entries(choices)) {
    if(sportId) db().prepare("INSERT INTO specializations VALUES(?,?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET sport_id=excluded.sport_id").run(userId,courseId,sportId);
    else db().prepare("DELETE FROM specializations WHERE user_id=? AND course_id=?").run(userId,courseId);
  }
}
export function userChoices(userId:string):Specializations {
  return Object.fromEntries(db().prepare("SELECT course_id,sport_id FROM specializations WHERE user_id=?").all(userId).map(row=>[String(row.course_id),String(row.sport_id)]));
}
