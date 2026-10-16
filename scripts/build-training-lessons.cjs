const {writeFileSync}=require('node:fs');
const {resolve}=require('node:path');
const base=require('../data/training-principles-unit1.json');
const design=require('../data/training-principles-design.cjs');
const {validateLessonBlocks}=require('../lib/lesson-blocks.ts');
if(base.length!==10 || design.length!==10)throw Error('Expected ten complete lessons.');
const enhanced=base.map((lesson,i)=>{
  const sections=[];
  for(const block of lesson.blocks){
    if(block.type==='text')sections.push({title:block.title,body:block.body});
    if(block.type==='explore')sections.push({title:block.title,body:[block.body,...block.items.map(item=>`### ${item.title}\n\n${item.body}`)].filter(Boolean).join('\n\n')});
  }
  const blocks=[...design[i].blocks,{type:'reading',title:'التفاصيل الأكاديمية… على مهلك.',body:'المفاهيم والمصطلحات والتفاصيل كاملة من مسودة الوحدة، مرتبة للرجوع إليها.',sections},...lesson.blocks.filter(b=>b.type==='cards'||b.type==='quiz')].map((b,n)=>({...b,id:`u01-l${String(i+1).padStart(2,'0')}-studio-${n+1}`}));
  const normalized=validateLessonBlocks(blocks);
  return {...lesson,intro:design[i].intro,durationMinutes:Math.max(lesson.durationMinutes,15),blocks:normalized,experienceVersion:2};
});
writeFileSync(resolve(__dirname,'../data/training-principles-interactive.json'),JSON.stringify(enhanced,null,2)+'\n');
console.log(`Built ${enhanced.length} learning experiences with ${enhanced.reduce((n,l)=>n+l.blocks.length,0)} authored blocks; full source explanations retained.`);
