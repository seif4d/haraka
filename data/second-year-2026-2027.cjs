// Second year, first semester. Empty matrix cells deliberately create no activity.
const groups={boys:[[1,2],[3,4],[5,6],[7,8,9]],girls:[[1,2,3],[4,5,6],[7,8,9],[10,11,12]]};
const sports={gymnastics:['جمباز','أساسيات الجمباز','صالة الجمباز الخامس'],defense:['دفاع','أساسيات الدفاع عن النفس','صالة الروف'],weights:['أثقال','أساسيات رفع الأثقال','صالة الأثقال بالأرضي'],basketball:['سلة','أساسيات كرة السلة','ملعب السلة 3 — الملاعب الجديدة'],expression:['تعبير','أساسيات التعبير الحركي','صالة التعبير الخامس'],computer:['حاسب عملي','الحاسب الآلي','']};
const time=h=>`${String(h).padStart(2,'0')}:00`;
const theory=(day,start,end,title,location,course=title)=>({day,start:time(start),end:time(end),title,location,course,kind:'lecture'});
function practical(gender,day,matrix){return matrix.flatMap((row,slot)=>row.flatMap((sport,group)=>{if(!sport)return [];const [title,course,location]=sports[sport];return [{day,start:time(8+slot*2),end:time(10+slot*2),title,course,location,kind:'practical',classGroups:groups[gender][group]}];}));}
const computer=(start,classGroups)=>({day:2,start:time(start),end:time(start+2),title:'حاسب عملي',course:'الحاسب الآلي',location:'',kind:'practical',classGroups});
module.exports={academicYear:'2026/2027',semester:1,sourceLabel:'جدول الفرقة الثانية — الفصل الدراسي الأول 2026/2027',cohorts:{
 boys:{dayNotes:{1:'لا توجد محاضرات مدرجة للبنين.',5:'لا توجد محاضرات مدرجة للبنين.'},entries:[
  theory(2,16,17,'أساسيات الجمباز','مدرج 1'),theory(2,17,18,'أساسيات الدفاع عن النفس','مدرج 1'),theory(2,18,19,'أساسيات رفع الأثقال','مدرج 1'),theory(2,19,20,'أساسيات كرة السلة','مدرج 1'),
  theory(4,8,10,'أساسيات مناهج التربية الرياضية','مدرج 1','أساسيات المناهج'),theory(4,10,12,'فسيولوجيا الرياضة','مدرج 1'),theory(4,12,14,'مبادئ التدريب الرياضي','مدرج 1'),theory(4,16,18,'حاسب آلي','مدرج 1','الحاسب الآلي'),
  ...practical('boys',0,[[null,'weights','defense','gymnastics'],['computer','computer','gymnastics','defense'],['defense','gymnastics','weights',null],['gymnastics','defense',null,'weights'],['weights',null,null,null]]),
  ...practical('boys',2,[['weights','basketball',null,null],['basketball','weights','computer','computer'],[null,null,'weights','basketball'],[null,null,'basketball','weights']]),
  ...practical('boys',3,[['gymnastics','defense','basketball',null],['defense','gymnastics',null,'basketball'],['basketball',null,'gymnastics','defense'],[null,'basketball','defense','gymnastics']])
 ]},
 girls:{dayNotes:{0:'لا توجد محاضرات مدرجة للبنات.',1:'لا توجد محاضرات مدرجة للبنات.'},entries:[
  theory(2,16,17,'أساسيات الدفاع عن النفس','مدرج 2'),theory(2,17,18,'أساسيات الجمباز','مدرج 2'),theory(2,18,19,'أساسيات كرة السلة','مدرج 2'),theory(2,19,20,'أساسيات التعبير الحركي','مدرج 2'),
  theory(3,12,14,'مبادئ التدريب الرياضي','مدرج 1'),theory(3,14,16,'أساسيات مناهج التربية الرياضية','مدرج 1','أساسيات المناهج'),theory(3,16,18,'فسيولوجيا الرياضة','مدرج 1'),theory(4,16,18,'حاسب آلي','مدرج 1','الحاسب الآلي'),
  computer(10,[1,2,3,4,5,6]),computer(14,[7,8,9,10,11,12]),
  ...practical('girls',4,[['gymnastics','expression','basketball','defense'],['expression','gymnastics','defense','basketball'],['basketball','defense','gymnastics','expression'],['defense','basketball','expression','gymnastics']]),
  ...practical('girls',5,[['defense','basketball','expression','gymnastics'],['basketball','defense','gymnastics','expression'],['expression','gymnastics','defense','basketball'],['gymnastics','expression','basketball','defense']])
 ]}
}};
