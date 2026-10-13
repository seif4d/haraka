import type { ScheduleEntry } from "./domain";

const DAY_INDEX:Record<string,number>={Sat:0,Sun:1,Mon:2,Tue:3,Wed:4,Thu:5,Fri:6};
export function cairoClock(date:Date) {
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Cairo",weekday:"short",year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
  const value=(key:string)=>parts.find(p=>p.type===key)!.value;
  return {day:DAY_INDEX[value("weekday")],minutes:Number(value("hour"))*60+Number(value("minute")),year:Number(value("year")),month:Number(value("month")),date:Number(value("day"))};
}
export const timeMinutes=(value:string)=>Number(value.slice(0,2))*60+Number(value.slice(3));
export function weekDates(date:Date) {
  const today=cairoClock(date);const saturday=Date.UTC(today.year,today.month-1,today.date-today.day);
  return Array.from({length:7},(_,i)=>new Date(saturday+i*86400000));
}
export function sessionState(entry:ScheduleEntry,date:Date):"live"|"past"|"upcoming"|"group" {
  const now=cairoClock(date);
  if(entry.day!==now.day)return "upcoming";
  if(entry.timeLabel?.includes("وما بعدها") && now.minutes>=timeMinutes(entry.start))return "group";
  if(now.minutes>=timeMinutes(entry.end))return "past";
  if(now.minutes>=timeMinutes(entry.start))return "live";
  return "upcoming";
}
export function nextSession(entries:ScheduleEntry[],date:Date) {
  const now=cairoClock(date);
  const live=entries.find(e=>sessionState(e,date)==="live");
  if(live)return {entry:live,daysAway:0,live:true};
  const candidates=entries.map(entry=>{let daysAway=(entry.day-now.day+7)%7;if(daysAway===0 && timeMinutes(entry.start)<=now.minutes)daysAway=7;return {entry,daysAway,live:false};});
  return candidates.sort((a,b)=>a.daysAway-b.daysAway || a.entry.start.localeCompare(b.entry.start))[0] || null;
}
export function agendaSearch(value:string,query:string) {
  const normalize=(s:string)=>s.normalize("NFKD").replace(/[\u064b-\u065f\u0670]/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").toLowerCase();
  return normalize(value).includes(normalize(query));
}
export function breakLabel(minutes:number) {
  if(minutes===60)return "ساعة";
  if(minutes===120)return "ساعتين";
  if(minutes%60===0)return `${minutes/60} ساعات`;
  return `${minutes} دقيقة`;
}
