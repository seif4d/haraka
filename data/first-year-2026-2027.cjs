// Timetable supplied by the platform owner, first year / first semester 2026–2027.
// Storage uses 24-hour times; the interface renders the existing 12-hour clock.
const slots=[['08:00','10:00'],['10:00','12:00'],['12:00','14:00'],['14:00','16:00']];
const sports={fencing:['مبارزة','أساسيات المبارزة','صالة المبارزة'],exercise:['تمرينات','أساسيات التمرينات','الجيم الصناعي بالملاعب القديمة'],track:['مضمار','أساسيات المضمار','الاستاد'],football:['قدم','أساسيات كرة القدم','الاستاد'],rhythm:['إيقاع','أساسيات الإيقاع الحركي','صالة الإيقاع']};
const theory=(day,start,end,title,location,course)=>({day,start,end,title,location,course,kind:'lecture'});
const academic=(day)=>[
 theory(day,'08:00','10:00','مقدمة في الإدارة','مدرج 2','مقدمة في الإدارة الرياضية'),
 theory(day,'10:00','12:00','فلسفة وتاريخ التربية الرياضية','مدرج 2','فلسفة وتاريخ التربية الرياضية'),
 theory(day,'12:00','14:00','التشريح الوصفي','مدرج 2','التشريح الوصفي'),
 theory(day,'14:00','16:00','اللغة الإنجليزية','مدرج 2','اللغة الإنجليزية')
];
function practical(day,matrix){return matrix.flatMap((row,slot)=>row.map((sport,group)=>{const [title,course,location]=sports[sport];return {day,start:slots[slot][0],end:slots[slot][1],title,course,location,kind:'practical',classGroups:Array.from({length:5},(_,i)=>group*5+i+1)};}));}
module.exports={academicYear:'2026/2027',semester:1,sourceLabel:'جدول الفرقة الأولى — الفصل الدراسي الأول 2026/2027',cohorts:{
 boys:{dayNotes:{1:'لا توجد محاضرات مدرجة للبنين.',4:'لا توجد محاضرات مدرجة للبنين.'},entries:[
  theory(0,'16:00','17:00','نظري أساسيات المضمار','مدرج 1','أساسيات المضمار'),
  theory(0,'17:00','18:00','نظري أساسيات المبارزة','مدرج 1','أساسيات المبارزة'),
  theory(0,'18:00','19:00','نظري أساسيات القدم','مدرج 1','أساسيات كرة القدم'),
  theory(0,'19:00','20:00','نظري أساسيات التمرينات','مدرج 1','أساسيات التمرينات'),
  ...academic(5),
  ...practical(2,[['fencing','exercise','track','football'],['exercise','fencing','football','track'],['track','football','fencing','exercise'],['football','track','exercise','fencing']]),
  ...practical(3,[['football','track','exercise','fencing'],['track','football','fencing','exercise'],['exercise','fencing','football','track'],['fencing','exercise','track','football']])
 ]},
 girls:{dayNotes:{4:'لا توجد محاضرات مدرجة للبنات.',5:'لا توجد محاضرات مدرجة للبنات.'},entries:[
  ...academic(0),
  theory(1,'16:00','17:00','نظري أساسيات المبارزة','مدرج 2','أساسيات المبارزة'),
  theory(1,'17:00','18:00','نظري أساسيات المضمار','مدرج 2','أساسيات المضمار'),
  theory(3,'18:00','19:00','نظري أساسيات الإيقاع الحركي','مدرج 1','أساسيات الإيقاع الحركي'),
  theory(3,'19:00','20:00','نظري أساسيات التمرينات','مدرج 2','أساسيات التمرينات'),
  ...practical(1,[['fencing','rhythm','track','exercise'],['rhythm','fencing','exercise','track'],['track','exercise','fencing','rhythm'],['exercise','track','rhythm','fencing']]),
  ...practical(2,[['exercise','track','rhythm','fencing'],['track','exercise','fencing','rhythm'],['rhythm','fencing','exercise','track'],['fencing','rhythm','track','exercise']])
 ]}
}};
