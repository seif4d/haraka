const assert = require('node:assert/strict');
const {randomBytes} = require('node:crypto');

module.exports = async ({base,call,admin,student,anon,owner,pupil,publicPage,password,layout,browser}) => {
  const initial=await call(admin,'admin/settings',undefined,'GET');
  assert.equal(initial.registrationOpen,true);assert.equal(initial.announcementEnabled,false);
  await call(anon,'admin/settings',undefined,'GET',401);
  await call(student,'admin/settings',initial,'PATCH',403);
  await call(student,'admin/account',{name:'مدير مزيف'},'PATCH',403);
  await call(student,'admin/password',{currentPassword:password,newPassword:password,confirmPassword:password},'POST',403);
  await call(admin,'admin/settings',{...initial,registrationOpen:'false'},'PATCH',400);
  await call(admin,'admin/settings',{...initial,supportEmail:'not-mail'},'PATCH',400);
  await call(admin,'admin/settings',{...initial,announcementEnabled:true,announcement:' '},'PATCH',400);
  await call(admin,'admin/settings',{...initial,role:'admin'},'PATCH',400);
  assert.deepEqual(await call(admin,'admin/settings',undefined,'GET'),initial);

  await owner.goto(base+'/admin/settings');
  await owner.getByRole('tab',{name:'إعدادات المنصة',exact:true}).focus();await owner.keyboard.press('ArrowLeft');assert.equal(await owner.getByRole('tab',{name:'حسابي والأمان',exact:true}).getAttribute('aria-selected'),'true');await owner.keyboard.press('ArrowRight');
  await owner.getByLabel('عنوان الصفحة',{exact:true}).fill('حركة — مساحة نفهم فيها');
  await owner.getByRole('tab',{name:'حسابي والأمان',exact:true}).click();await owner.getByRole('tab',{name:'إعدادات المنصة',exact:true}).click();assert.equal(await owner.getByLabel('عنوان الصفحة',{exact:true}).inputValue(),'حركة — مساحة نفهم فيها');
  await owner.getByLabel('وصف المنصة',{exact:true}).fill('شرح وتجربة ومراجعة. مساحتك الجديدة لتعلّم علوم الرياضة.');
  await owner.getByLabel('بريد التواصل',{exact:false}).fill('help@example.test');
  await owner.getByRole('switch',{name:/استقبال حسابات جديدة/}).uncheck();
  await owner.getByRole('switch',{name:/إظهار إعلان عام/}).check();
  const announcement='ملخصات الأسبوع الجديد متاحة في المكتبة ✨';
  await owner.getByLabel('نص الإعلان',{exact:true}).fill(announcement);
  await owner.getByRole('button',{name:'حفظ الإعدادات',exact:true}).click();
  await owner.getByText('اتحفظت الإعدادات واتطبّقت على المنصة.',{exact:true}).waitFor();
  await owner.reload();assert.equal(await owner.getByLabel('عنوان الصفحة',{exact:true}).inputValue(),'حركة — مساحة نفهم فيها');
  const saved=await call(admin,'admin/settings',undefined,'GET');assert.equal(saved.registrationOpen,false);assert.equal(saved.supportEmail,'help@example.test');
  await publicPage.goto(base);assert.equal(await publicPage.title(),saved.pageTitle);
  await publicPage.locator('.landing-intro').filter({hasText:saved.description}).waitFor();
  assert.equal(await publicPage.locator('meta[name="description"]').getAttribute('content'),saved.description);
  assert.equal(await publicPage.getByRole('link',{name:'تواصل معانا',exact:true}).getAttribute('href'),'mailto:help@example.test');
  assert.equal(await publicPage.locator('a[href="/register"]').count(),0);
  await publicPage.locator('.platform-notice').getByText(announcement,{exact:true}).waitFor();
  await publicPage.goto(base+'/register');await publicPage.getByRole('heading',{name:'التسجيل متوقف حاليًا.'}).waitFor();assert.equal(await publicPage.locator('form').count(),0);
  await call(anon,'auth/register',{name:'حساب مرفوض',email:'closed@example.test',password,confirmPassword:password},'POST',403);
  await publicPage.goto(base+'/login');assert.equal(await publicPage.locator('a[href="/register"]').count(),0);assert(await publicPage.locator('[name=email]').isVisible());
  assert.equal((await call(student,'student/state',undefined,'GET')).announcement,announcement);
  await pupil.goto(base+'/student');await pupil.locator('.platform-notice').getByText(announcement,{exact:true}).waitFor();
  for(const width of [320,390,768,1440]) {
    await layout(owner,'/admin/settings',width,'admin-settings');
    await owner.getByRole('tab',{name:'حسابي والأمان',exact:true}).click();
    assert(await owner.getByLabel('كلمة المرور الحالية',{exact:true}).isVisible());
    assert(await owner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await owner.screenshot({path:`test-results/admin-account-${width}.png`,fullPage:true,animations:'disabled'});
    await layout(publicPage,'/',width,'landing-announcement');
    await layout(pupil,'/student',width,'student-announcement');
  }
  await owner.goto(base+'/admin/settings');
  await owner.getByLabel('عنوان الصفحة',{exact:true}).fill('تعديل متراجع عنه');
  await owner.getByRole('button',{name:'تراجع عن التغييرات',exact:true}).click();
  assert.equal(await owner.getByLabel('عنوان الصفحة',{exact:true}).inputValue(),saved.pageTitle);
  await call(admin,'admin/settings',initial,'PATCH');
  await publicPage.goto(base);assert.equal(await publicPage.locator('.platform-notice').count(),0);assert(await publicPage.locator('a[href="/register"]').count()>0);
  assert.equal((await call(student,'student/state',undefined,'GET')).announcement,'');
  // Registration reopens without affecting existing users.
  const reopened=await browser.newContext();
  try {await call(reopened,'auth/register',{name:'طالب جديد',email:'reopened@example.test',password,confirmPassword:password},'POST',201);} finally {await reopened.close();}

  await owner.getByRole('tab',{name:'حسابي والأمان',exact:true}).click();
  await owner.getByLabel('اسم المدير',{exact:true}).fill('مدير المنصة المحدّث');
  await owner.getByRole('button',{name:'حفظ بياناتي',exact:true}).click();await owner.getByText('اتحفظ اسم حسابك.',{exact:true}).waitFor();
  await owner.reload();await owner.getByRole('tab',{name:'حسابي والأمان',exact:true}).click();
  assert.equal(await owner.getByLabel('اسم المدير',{exact:true}).inputValue(),'مدير المنصة المحدّث');
  const other=await browser.newContext();
  try {
    await call(other,'auth/login',{email:'owner@example.test',password});
    const newPassword=randomBytes(24).toString('hex');
    await call(admin,'admin/password',{currentPassword:'incorrect-password',newPassword,confirmPassword:newPassword},'POST',401);
    await call(admin,'admin/password',{currentPassword:password,newPassword,confirmPassword:'different-password'},'POST',400);
    await call(other,'admin/state',undefined,'GET');
    await owner.getByLabel('كلمة المرور الحالية',{exact:true}).fill(password);
    await owner.getByLabel('كلمة المرور الجديدة',{exact:true}).fill(newPassword);
    await owner.getByLabel('تأكيد كلمة المرور الجديدة',{exact:true}).fill(newPassword);
    await owner.getByRole('button',{name:'تغيير كلمة المرور',exact:true}).click();
    await owner.getByRole('status').filter({hasText:'اتغيّرت كلمة المرور.'}).waitFor();
    assert.equal(await owner.getByLabel('كلمة المرور الحالية',{exact:true}).inputValue(),'');
    await call(admin,'admin/state',undefined,'GET');await call(other,'admin/state',undefined,'GET',401);
    await call(anon,'auth/login',{email:'owner@example.test',password},'POST',401);
    await call(other,'auth/login',{email:'owner@example.test',password:newPassword});await call(other,'admin/settings',undefined,'GET');
    const actions=(await call(admin,'admin/state',undefined,'GET')).audit.map(a=>a.action);assert(actions.includes('change_admin_password'));assert(actions.includes('update_settings'));
  } finally {await other.close();}
  console.log('PASS: admin settings persist; public metadata/contact and student announcements; registration enforced/reopened; responsive settings/account UI; authorization and validation; admin profile/password changes revoke other sessions while preserving the current session.');
};
