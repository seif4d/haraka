import { BLOCK_LABELS, newLessonBlock, type BlockType, type LessonBlock } from "./lesson-blocks.ts";
export type CommandGroup='write'|'interact'|'media';
export type LessonCommand={key:string;type:BlockType;label:string;description:string;aliases:string;group:CommandGroup;shortcut?:string;variant?:string};
export const COMMAND_GROUPS:Record<CommandGroup,string>={write:'كتابة وتنسيق',interact:'تفاعل وتطبيق',media:'وسائط ومراجع'};
const writing:LessonCommand[]=[
  {key:'paragraph',type:'paragraph',label:'نص',description:'ابدأ الفكرة واكتب براحتك',aliases:'text paragraph فقرة كتابة',group:'write'},
  {key:'heading',type:'heading',label:'عنوان رئيسي',description:'افصل المحاور الكبيرة للدرس',aliases:'h2 heading عنوان',group:'write',shortcut:'##'},
  {key:'heading-3',type:'heading',label:'عنوان فرعي',description:'عنوان أصغر لفكرة داخل المحور',aliases:'h3 subtitle heading عنوان',group:'write',shortcut:'###',variant:'small'},
  {key:'list',type:'list',label:'قائمة نقطية',description:'رتّب الأفكار في نقاط واضحة',aliases:'bullet list نقاط قائمة',group:'write',shortcut:'-'},
  {key:'list-number',type:'list',label:'قائمة مرقمة',description:'خطوات بتسلسل واضح',aliases:'number ordered list ترتيب قائمة',group:'write',shortcut:'1.',variant:'number'},
  {key:'callout',type:'callout',label:'تنبيه ملوّن',description:'أبرز فكرة مهمة أو نقطة للمراجعة',aliases:'callout note warning ملاحظة تنبيه ملحوظة فكرة',group:'write'},
  {key:'quote',type:'quote',label:'اقتباس',description:'نص مميز مع اسم صاحبه لو تحب',aliases:'quote اقتباس مقولة',group:'write',shortcut:'>'},
  {key:'divider',type:'divider',label:'فاصل',description:'مساحة تنفّس بين فكرتين',aliases:'divider line فصل خط',group:'write',shortcut:'---'},
  {key:'table',type:'table',label:'جدول',description:'قارن البيانات أو لخّص الفروق',aliases:'table جدول مقارنة بيانات',group:'write'},
  {key:'text',type:'text',label:BLOCK_LABELS.text,description:'عنوان ومعاه شرح قصير',aliases:'شرح عنوان text',group:'write'},
];
const activities:[BlockType,string,string][]=[['checklist','قائمة لمتابعة الفهم خطوة بخطوة','checklist todo مهام مراجعة'],['toggle','شرح يفتحه الطالب وقت ما يحتاجه','toggle accordion طي اكشف سؤال'],['cards','وجه للفكرة، وظهر يكشف معناها','card flashcard بطاقة بطاقات'],['quiz','اختيارات وتفسير للإجابة','quiz question سؤال اختبار'],['explore','أفكار يكتشفها الطالب ويقارنها','compare explore مقارنة'],['sequence','تحدّي ترتيب خطوات الفكرة','sequence steps ترتيب خطوات'],['simulation','حمل التدريب أو الاستشفاء','simulation محاكاة معمل'],['story','ابدأ بموقف وخلّي الطالب يقرر','story قصة موقف'],['timeline','احكِ تطور الفكرة عبر الزمن','timeline تاريخ زمني'],['map','اربط المصطلحات بالأمثلة','map خريطة مفاهيم'],['sort','وزّع الأمثلة على الفئات','sort تصنيف'],['lab','تجارب بمتغيرات يحرّكها الطالب','lab تجربة استوديو'],['reading','قراءة أكاديمية مقسّمة','reading قراءة أكاديمي']];
export const LESSON_COMMANDS:LessonCommand[]=[...writing,...activities.map(([type,description,aliases])=>({key:type,type,label:BLOCK_LABELS[type],description,aliases,group:'interact' as const})),{key:'video',type:'video',label:'فيديو يوتيوب',description:'أضف الفيديو في مكانه وسط الشرح',aliases:'video youtube يوتيوب فيديو',group:'media'},{key:'resource',type:'resource',label:'بطاقة مرجع',description:'كتاب أو ملف أو رابط يكمّل الفكرة',aliases:'resource link file مرجع كتاب ملف رابط',group:'media'}];
export function commandBlock(command:LessonCommand,id:string):LessonBlock{const block=newLessonBlock(command.type,id);if(block.type==='heading'&&command.variant==='small')block.level=3;if(block.type==='list'&&command.variant==='number')block.style='number';return block;}
export const normalizeCommand=(v:string)=>v.normalize('NFKD').replace(/[أإآ]/g,'ا').replace(/[ى]/g,'ي').replace(/[\u064B-\u065F\u0670]/g,'').toLowerCase().trim();
