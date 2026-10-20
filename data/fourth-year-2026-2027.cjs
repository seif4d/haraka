const row=(day,start,title,location='',extra={})=>({day,start:`${String(start).padStart(2,'0')}:00`,end:`${String(start+2).padStart(2,'0')}:00`,title,location,...extra});
const practical={kind:'practical'};
const sport=(day,start,title,category,extra={})=>row(day,start,title,'',{...practical,category,...extra});
const analysisNotes='التحليل الحركي العملي موزع على فصول ومجموعات؛ راجع الفصل المخصص لمجموعتك.';
const fieldNote='تربية عملية خارجية — حسب فترة التربية العملية؛ الموعد تحدده جهة التدريب.';
module.exports={academicYear:'2026/2027',semester:1,sourceLabel:'جدول الفرقة الرابعة — الفصل الدراسي الأول 2026/2027',tracks:{
 training:{dayNotes:{4:'لا توجد محاضرات مدرجة للقسم.',5:'لا توجد محاضرات مدرجة للقسم.'},entries:[
  row(0,8,'تربية عملية داخلية','الملاعب الجديدة',{...practical,course:'التدريب الميداني'}),
  row(1,12,'مبادئ التحليل الحركي','مدرج 1',{course:'مبادئ التحليل الحركي'}),row(1,14,'بحث علمي','مدرج 1',{course:'البحث العلمي ومشكلات التدريب الرياضي'}),
  row(2,8,'المنشطات في المجال الرياضي','مدرج 1',{course:'المنشطات في المجال الرياضي'}),row(2,10,'التعلم الحركي','مدرج 1',{course:'التعلم الحركي'}),row(3,8,'تدريب رياضي 2','مدرج 1',{course:'التدريب الرياضي 2'}),
  row(3,10,'نظري تخصصات فردية','فصول 1–4',{category:'individual'}),row(3,12,'نظري تخصصات جماعية','فصول 1–4',{category:'team'}),
  sport(0,12,'تخصص جمباز','individual',{gender:'boys',sportId:'gymnastics',location:'صالة الجمباز بالدور الخامس'}),row(0,12,'تحليل حركي عملي','',{...practical,gender:'girls',course:'مبادئ التحليل الحركي',notes:analysisNotes}),
  row(0,14,'تحليل حركي عملي','',{...practical,gender:'boys',course:'مبادئ التحليل الحركي',notes:analysisNotes}),row(0,14,'حسب توزيع المجموعات','',{...practical,gender:'girls',notes:'النشاط حسب توزيع المجموعات.'}),
  ...[1,2].flatMap(day=>[
   sport(day,day===1?8:12,'تخصصات جماعية','team',{gender:'boys',location:'الملاعب الجديدة'}),sport(day,day===1?8:12,'تخصصات فردية','individual',{gender:'girls'}),
   sport(day,day===1?10:14,'تخصصات فردية ما عدا الجمباز','individual',{gender:'boys',excludedSportIds:['gymnastics']}),sport(day,day===1?10:14,'تخصصات جماعية','team',{gender:'girls',location:'الملاعب الجديدة'})]),
  sport(2,16,'تخصص جمباز','individual',{gender:'boys',sportId:'gymnastics',location:'صالة الجمباز بالدور الخامس'})
 ]},
 management:{dayNotes:{0:'لا توجد محاضرات مدرجة للقسم.',1:'لا توجد محاضرات مدرجة للقسم.'},entries:[
  row(2,8,'البحث العلمي','مدرج 2',{course:'البحث العلمي'}),row(2,10,'الترويح وأوقات الفراغ','مدرج 2',{course:'الترويح وأوقات الفراغ'}),row(2,12,'إدارة المعسكرات','مدرج 2',{course:'إدارة المعسكرات الرياضية'}),row(2,14,'التسويق الرياضي','مدرج 2',{course:'التسويق الرياضي'}),
  row(4,8,'نظري تخصصات فردية','فصول 1–4',{category:'individual'}),row(4,10,'نظري تخصصات جماعية','فصول 1–4',{category:'team'}),row(4,18,'التسويق الرياضي','مدرج 2',{course:'التسويق الرياضي'}),row(5,12,'التنظيمات الرياضية','مدرج 1',{course:'التنظيمات الرياضية'}),
  sport(3,8,'تخصص كرة اليد','team',{gender:'boys',sportId:'handball'}),sport(3,10,'تخصص كرة اليد','team',{gender:'girls',sportId:'handball'}),
  sport(3,12,'تخصصات جماعية','team',{gender:'boys'}),sport(3,12,'تخصصات فردية (ميدان وساحة)','individual',{gender:'girls',allowedSportIds:['field','track']}),
  sport(3,14,'تخصصات فردية','individual',{gender:'boys'}),sport(3,14,'تخصصات جماعية','team',{gender:'girls'}),row(3,18,'تربية عملية خارجية','',{...practical,course:'التدريب الميداني'}),
  sport(4,12,'تخصصات جماعية','team',{gender:'boys'}),sport(4,12,'تخصصات فردية (جمباز فني، إيقاعي، ميدان)','individual',{gender:'girls',allowedSportIds:['gymnastics','rhythmic','field']}),
  sport(4,14,'تخصصات فردية (مبارزة، ملاكمة)','individual',{gender:'boys',allowedSportIds:['fencing','boxing']}),sport(4,14,'تخصصات جماعية','team',{gender:'girls'}),
  sport(4,16,'جمباز فني وسباحة','individual',{gender:'boys',allowedSportIds:['gymnastics','swimming']}),sport(4,16,'مبارزة','individual',{gender:'girls',sportId:'fencing'}),
  sport(5,8,'سباحة','individual',{gender:'girls',sportId:'swimming'}),sport(5,10,'مبارزة وجمباز فني وإيقاعي','individual',{gender:'girls',allowedSportIds:['fencing','gymnastics','rhythmic']}),
  row(5,16,'تربية عملية خارجية','',{...practical,course:'التدريب الميداني',end:'20:00'})
 ]},
 teaching:{dayNotes:{0:'لا توجد محاضرات مدرجة للقسم.',1:fieldNote,2:fieldNote},entries:[
  row(3,14,'البحث العلمي','مدرج 2',{course:'البحث العلمي ومشكلات التربية المدرسية'}),row(3,16,'مناهج التربية الرياضية','مدرج 2',{course:'مناهج التربية الرياضية'}),row(4,12,'مبادئ التحليل الحركي','مدرج 2',{course:'مبادئ التحليل الحركي'}),row(4,14,'التربية المقارنة','مدرج 2',{course:'التربية المقارنة'}),row(4,16,'التعلم الحركي','مدرج 2',{course:'التعلم الحركي'}),
  row(5,8,'نظري تخصصات فردية','فصول 1–4',{category:'individual'}),row(5,10,'نظري تخصصات جماعية','فصول 1–4',{category:'team'}),
  sport(2,14,'تخصص جمباز','individual',{gender:'girls',sportId:'gymnastics'}),
  ...[3,4].flatMap(day=>[sport(day,8,'تخصصات جماعية','team',{gender:'boys'}),sport(day,8,'تخصصات فردية','individual',{gender:'girls'}),sport(day,10,'تخصصات فردية','individual',{gender:'boys'}),sport(day,10,'تخصصات جماعية','team',{gender:'girls'})]),
  sport(3,12,'تخصص جمباز','individual',{gender:'boys',sportId:'gymnastics'}),row(5,12,'تحليل حركي عملي','',{...practical,gender:'boys',course:'مبادئ التحليل الحركي',notes:analysisNotes}),sport(5,12,'سباحة','individual',{gender:'girls',sportId:'swimming'}),
  sport(5,14,'سباحة','individual',{gender:'boys',sportId:'swimming'}),row(5,14,'تحليل حركي عملي','',{...practical,gender:'girls',course:'مبادئ التحليل الحركي',notes:analysisNotes}),sport(5,16,'تخصص جمباز','individual',{gender:'boys',sportId:'gymnastics'})
 ]}
}};
