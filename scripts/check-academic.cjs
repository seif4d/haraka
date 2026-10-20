const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
module.exports=async function academicChecks({base,call,admin,student,second,owner,pupil,profile,courseId,layout}){
  await owner.setViewportSize({width:1440,height:900});await pupil.setViewportSize({width:1440,height:900});
  await call(student,'student/profile',profile,'PATCH');await call(second,'student/profile',{...profile,name:'طالب ثان'},'PATCH');
  const pdf=Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
  async function upload(context,purpose,assignmentId,name='test.pdf',bytes=pdf,expected=201){
    const result=await context.request.post(`${base}/api/files`,{headers:{Origin:base},multipart:{purpose,...(assignmentId?{assignmentId}:{}),file:{name,mimeType:'application/pdf',buffer:bytes}}});
    assert.equal(result.status(),expected,await result.text());return result.json();
  }
  async function fileStatus(context,id,status){const response=await context.request.get(`${base}/api/files/${id}`);assert.equal(response.status(),status);return response;}
  async function learning(context){return call(context,'student/learning',undefined,'GET');}
  async function management(){return (await call(admin,'admin/state',undefined,'GET')).learning;}
  // A real uploaded library file, initially private, then published to its cohort.
  await owner.goto(`${base}/admin/library`);await owner.getByRole('button',{name:'إضافة مورد للمكتبة',exact:true}).click();
  await owner.locator('[name=title]').fill('ملخص الحركة للاختبار');await owner.locator('[name=kind]').selectOption('summary');
  await owner.locator('textarea[name=description]').fill('ملخص تجريبي للتحقق من تحميل الملفات وفصل المسارات.');await owner.locator('[name=source]').fill('مصدر اختبار فقط');
  await owner.getByLabel('رفع ملف',{exact:true}).setInputFiles({name:'ملخص-تجريبي.pdf',mimeType:'application/pdf',buffer:pdf});await owner.locator('.selected-file strong').waitFor();
  await owner.getByRole('button',{name:'حفظ المحتوى وحالة النشر',exact:true}).click();await owner.getByRole('heading',{name:'ملخص الحركة للاختبار',exact:true}).waitFor();
  const resource=(await management()).resources.find(r=>r.title==='ملخص الحركة للاختبار');assert(resource?.file);
  assert(!(await learning(student)).resources.some(r=>r.id===resource.id));await fileStatus(student,resource.file.id,404);
  await call(admin,'admin/library',{...resource,fileId:resource.file.id,status:'published'});
  assert((await learning(student)).resources.some(r=>r.id===resource.id));const download=await fileStatus(student,resource.file.id,200);assert.deepEqual(await download.body(),pdf);assert(download.headers()['content-disposition'].includes('attachment'));
  await pupil.goto(`${base}/student/library`);await pupil.getByRole('heading',{name:resource.title,exact:true}).waitFor();await pupil.getByLabel('البحث في المكتبة',{exact:true}).fill('ملخص الحركه');
  await pupil.getByLabel('البحث في المكتبة',{exact:true}).fill('ملخص');assert.equal(await pupil.locator('.resource-card').count(),1);
  await upload(student,'material',null,'unauthorized.pdf',pdf,403);await upload(admin,'material',null,'spoof.pdf',Buffer.from('<html>fake PDF</html>'),400);
  await call(admin,'admin/library',{...resource,fileId:null,url:'javascript:alert(1)',status:'published'},'POST',400);
  await call(student,'admin/library',{...resource,status:'published'},'POST',403);
  await call(student,'student/profile',{...profile,year:1,track:'general'},'PATCH');assert.equal((await learning(student)).resources.length,0);await fileStatus(student,resource.file.id,404);await call(student,'student/profile',profile,'PATCH');
  // Staff create a deadline, student uploads and submits, staff return/review it.
  await owner.goto(`${base}/admin/assignments`);await owner.getByRole('button',{name:'إضافة تكليف',exact:true}).click();
  await owner.locator('[name=title]').fill('تكليف تحليل موقف رياضي');await owner.locator('[name=requester]').fill('دكتور تجريبي');await owner.locator('[name=instructions]').fill('اشرح الفكرة ثم أضف مثالًا وتطبيقًا. هذا محتوى اختباري.');
  const future=new Date(Date.now()+86400000);const localFuture=new Date(future.getTime()-future.getTimezoneOffset()*60000).toISOString().slice(0,16);
  await owner.locator('[name=dueAt]').fill(localFuture);await owner.locator('[name=maxScore]').fill('20');await owner.locator('[name=status]').selectOption('published');await owner.getByRole('button',{name:'حفظ المحتوى وحالة النشر',exact:true}).click();await owner.getByRole('heading',{name:'تكليف تحليل موقف رياضي',exact:true}).waitFor();
  const assignment=(await management()).assignments.find(a=>a.title==='تكليف تحليل موقف رياضي');assert(assignment);
  await pupil.goto(`${base}/student/assignments/${assignment.id}`);await pupil.locator('[name=submissionText]').fill('إجابتي الأولى: فكرة واضحة ومثال مرتبط بالحركة.');
  await pupil.getByLabel('رفع ملف',{exact:true}).setInputFiles({name:'إجابتي.pdf',mimeType:'application/pdf',buffer:pdf});await pupil.locator('.selected-file strong').waitFor();
  await pupil.getByRole('button',{name:'تسليم التكليف',exact:true}).click();await pupil.getByText('اتحفظ تسليمك بنجاح.',{exact:true}).waitFor();
  await pupil.reload();assert.equal(await pupil.locator('[name=submissionText]').inputValue(),'إجابتي الأولى: فكرة واضحة ومثال مرتبط بالحركة.');
  let submission=(await learning(student)).assignments.find(a=>a.id===assignment.id).submission;assert(submission?.file);
  assert.equal((await learning(second)).assignments.find(a=>a.id===assignment.id).submission,null);await fileStatus(second,submission.file.id,404);await fileStatus(admin,submission.file.id,200);
  await call(second,'student/submissions',{assignmentId:assignment.id,text:'نسخة من إجابة غيري',fileId:submission.file.id},'POST',403);
  await call(student,'admin/submissions',{id:submission.id,status:'graded',score:20,feedback:''},'PATCH',403);
  await owner.goto(`${base}/admin/assignments`);await owner.getByRole('button',{name:'التسليمات (1)',exact:true}).click();await owner.getByRole('button',{name:/^مراجعة تسليم/}).click();await owner.locator('.submission-review-card [name=status]').selectOption('returned');await owner.locator('.submission-review-card [name=feedback]').fill('أضف تطبيقًا أوضح للفكرة.');
  await owner.getByRole('button',{name:'حفظ المراجعة',exact:true}).click();await owner.locator('[data-submission-id]').getByText('أُعيد للمراجعة',{exact:true}).waitFor();
  await pupil.reload();await pupil.getByText('أضف تطبيقًا أوضح للفكرة.',{exact:true}).waitFor();await pupil.locator('[name=submissionText]').fill('إجابة معدّلة تتضمن تطبيقًا أوضح للفكرة.');await pupil.getByRole('button',{name:'حفظ تعديل التسليم',exact:true}).click();await pupil.getByText('اتحفظ تسليمك بنجاح.',{exact:true}).waitFor();
  await call(admin,'admin/submissions',{id:submission.id,status:'graded',score:21,feedback:''},'PATCH',400);
  await call(admin,'admin/submissions',{id:submission.id,status:'graded',score:18,feedback:'تطبيق جيد، واصل المراجعة.'},'PATCH');await pupil.reload();await pupil.getByRole('heading',{name:'درجتك: 18 / 20',exact:true}).waitFor();assert(await pupil.locator('[name=submissionText]').isDisabled());
  await call(student,'student/submissions',{assignmentId:assignment.id,text:'تعديل بعد التصحيح'},'POST',409);await call(admin,'admin/assignments',{id:assignment.id},'DELETE',409);
  const lateId=(await call(admin,'admin/assignments',{...assignment,id:undefined,title:'تكليف انتهى',dueAt:new Date(Date.now()-60000).toISOString(),fileId:null})).id;
  await call(student,'student/submissions',{assignmentId:lateId,text:'إجابة متأخرة'},'POST',409);
  // A server-scored timed exam. Answers and explanations must not arrive early.
  await owner.goto(`${base}/admin/exams`);await owner.getByRole('button',{name:'إضافة اختبار',exact:true}).click();await owner.locator('[name=title]').fill('اختبار فهم الحركة');await owner.locator('[name=instructions]').fill('اختبار تجريبي لسير العمل.');
  const question=owner.locator('.question-editor');await question.getByLabel('نص السؤال',{exact:true}).fill('ما ناتج واحد زائد واحد؟');
  for(let i=0;i<4;i++)await question.getByLabel(`الاختيار ${['أ','ب','ج','د'][i]}`,{exact:true}).fill(String(i+1));
  await question.getByLabel('الإجابة الصحيحة',{exact:true}).selectOption('1');await question.getByLabel('درجة السؤال',{exact:true}).fill('3');await question.getByLabel('ليه الإجابة صحيحة؟',{exact:false}).fill('PRIVATE_EXPLANATION: لأن واحدًا زائد واحد يساوي اثنين.');
  await owner.locator('[name=status]').selectOption('published');await owner.getByRole('button',{name:'حفظ المحتوى وحالة النشر',exact:true}).click();await owner.getByRole('heading',{name:'اختبار فهم الحركة',exact:true}).waitFor();
  const exam=(await management()).exams.find(e=>e.title==='اختبار فهم الحركة');assert(exam);
  let safe=await learning(student);assert(!JSON.stringify(safe.exams).includes('correctIndex'));assert(!JSON.stringify(safe.exams).includes('PRIVATE_EXPLANATION'));
  await pupil.goto(`${base}/student/exams`);await pupil.getByRole('button',{name:'ابدأ الاختبار',exact:true}).click();await pupil.waitForURL(/\/student\/exams\/attempts\//);
  const attemptId=new URL(pupil.url()).pathname.split('/').pop();let attempt=(await call(student,`student/exam-attempts/${attemptId}`,undefined,'GET')).attempt;
  assert(!('correctIndex' in attempt.questions[0]));assert(!('explanation' in attempt.questions[0]));assert.equal((await call(student,'student/exams/start',{examId:exam.id})).attempt.id,attemptId);
  await call(second,`student/exam-attempts/${attemptId}`,undefined,'GET',404);
  const otherPage=await second.newPage();assert.equal((await otherPage.goto(`${base}/student/exams/attempts/${attemptId}`)).status(),404);await otherPage.close();
  await call(student,'student/exams/answer',{attemptId,answers:{missing:1}},'PATCH',400);await call(student,'student/exams/answer',{attemptId,answers:{[attempt.questions[0].id]:4}},'PATCH',400);
  await pupil.getByRole('radio').nth(1).click();await pupil.getByRole('button',{name:'تسليم الاختبار',exact:true}).waitFor({state:'visible'});await pupil.waitForFunction(()=>!document.querySelector('.exam-question-footer button:last-of-type').disabled);
  await pupil.reload();assert.equal(await pupil.getByRole('radio').nth(1).getAttribute('aria-checked'),'true');await pupil.getByRole('button',{name:'تسليم الاختبار',exact:true}).click();await pupil.getByRole('heading',{name:'نتيجتك، وفكرة أوضح.',exact:true}).waitFor();
  attempt=(await call(student,`student/exam-attempts/${attemptId}`,undefined,'GET')).attempt;assert.equal(attempt.score,3);assert.equal(attempt.total,3);assert.equal(attempt.passed,true);assert.equal(attempt.questions[0].correctIndex,1);
  assert.equal((await call(student,'student/exams/submit',{attemptId,answers:{},score:999})).attempt.score,3);
  await call(student,'student/exams/start',{examId:exam.id},'POST',409);await call(admin,'admin/exams',{...exam,status:'draft'},'POST',409);await call(admin,'admin/exams',{id:exam.id},'DELETE',409);
  const timedId=(await call(admin,'admin/exams',{...exam,id:undefined,title:'اختبار انتهاء الوقت',durationMinutes:1,attemptLimit:2})).id;
  let timed=(await call(student,'student/exams/start',{examId:timedId})).attempt;await call(student,'student/exams/answer',{attemptId:timed.id,answers:{[timed.questions[0].id]:1}},'PATCH');
  const database=new DatabaseSync(process.env.HARKA_TEST_DATABASE);database.prepare("UPDATE exam_attempts SET ends_at=? WHERE id=?").run(new Date(Date.now()-1000).toISOString(),timed.id);database.close();
  timed=(await call(student,`student/exam-attempts/${timed.id}`,undefined,'GET')).attempt;assert.equal(timed.status,'expired');assert.equal(timed.score,3);
  const secondTry=(await call(student,'student/exams/start',{examId:timedId})).attempt;assert.notEqual(secondTry.id,timed.id);
  const forged=(await call(student,'student/exams/submit',{attemptId:secondTry.id,answers:{[secondTry.questions[0].id]:0},score:999,passed:true})).attempt;assert.equal(forged.score,0);assert.equal(forged.passed,false);
  const futureId=(await call(admin,'admin/exams',{...exam,id:undefined,title:'اختبار لم يفتح',opensAt:new Date(Date.now()+86400000).toISOString()})).id;await call(student,'student/exams/start',{examId:futureId},'POST',409);
  const expiredId=(await call(admin,'admin/exams',{...exam,id:undefined,title:'اختبار انتهى',closesAt:new Date(Date.now()-60000).toISOString()})).id;await call(student,'student/exams/start',{examId:expiredId},'POST',409);
  await call(student,'student/profile',{...profile,year:1,track:'general'},'PATCH');await call(student,'student/exams/start',{examId:exam.id},'POST',404);assert.equal((await pupil.goto(`${base}/student/assignments/${assignment.id}`)).status(),404);await call(student,'student/profile',profile,'PATCH');
  for(const width of [320,390,768,1440]){for(const path of ['/student/library','/student/assignments',`/student/assignments/${assignment.id}`,'/student/exams',`/student/exams/attempts/${attemptId}`])await layout(pupil,path,width,`academic-${path.split('/').slice(-1)[0]}`);for(const path of ['/admin/library','/admin/assignments','/admin/exams'])await layout(owner,path,width,`academic-admin-${path.split('/').pop()}`);}
  console.log('PASS: library upload/download and private files; assignment submission/return/grading/deadlines; timed exams, autosave, hidden answers, private attempts, limits, expiry, immutable results; responsive academic sections.');
};
