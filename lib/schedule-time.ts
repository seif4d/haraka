export function scheduleTime(value:string) {
  const [hours,minutes]=value.split(":").map(Number);
  return `${hours%12 || 12}:${String(minutes).padStart(2,"0")} ${hours<12?"ص":"م"}`;
}
export function scheduleTimeRange(start:string,end:string,label?:string) {
  const range=`${scheduleTime(start)} — ${scheduleTime(end)}`;
  if(!label)return range;
  if(/^\d{1,2}\s*[–—-]\s*\d{1,2}/.test(label))return range+label.replace(/^\d{1,2}\s*[–—-]\s*\d{1,2}/,"");
  return label.replace(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g,scheduleTime);
}
export function scheduleNote(value:string) {return value.replace(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g,scheduleTime);}
