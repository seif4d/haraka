# نشر حركة على Coolify

العنوان المستهدف: **https://haraka.seif4d.com**. هذا الدليل لإعداد التطبيق بنفسك؛ ملفات المشروع لا تغيّر DNS أو إعدادات الـVPS تلقائيًا.

## 1. DNS

في إدارة DNS الخاصة بـ `seif4d.com`:

| الحقل | القيمة |
| --- | --- |
| Type | `A` |
| Name / Host | `haraka` |
| Value | عنوان IPv4 العام للـVPS الذي سيشغّل التطبيق |
| TTL | القيمة الافتراضية أو Auto |

تأكد أن أي سجل `AAAA` لنفس الاسم يشير إلى IPv6 صحيح لنفس الخادم. منفذا `80` و`443` يصلان إلى بروكسي Coolify. لا تحتاج فتح منفذ التطبيق `3000` للعامة؛ البروكسي يوجّه إليه داخل شبكة Docker. [مرجع الدومينات](https://coolify.io/docs/core/networking/domains)

## 2. إضافة التطبيق

داخل مشروعك في Coolify، اختر **New Resource → Public Repository** (أو GitHub App المتصل عندك)، ثم استخدم:

| الإعداد | القيمة |
| --- | --- |
| Repository | `https://github.com/seif4d/haraka.git` |
| Branch | `main` |
| Build Pack / Build Strategy | `Dockerfile` |
| Base Directory | `/` |
| Dockerfile Location | `/Dockerfile` |
| Ports Exposes | `3000` |
| Domain | `https://haraka.seif4d.com` |
| Instances | نسخة واحدة على نفس الخادم |

إذا واجهة الدومين تفصل الحقول: Protocol = `https`، Domain = `haraka.seif4d.com`، Port = `3000`، وPath فارغ. شهادة HTTPS يديرها بروكسي Coolify بعد اكتمال DNS وإتاحة المنافذ. لا تضف `:3000` إلى رابط التصفح العام. [مرجع Dockerfile](https://coolify.io/docs/applications/builds/dockerfile)

لا تضبط أوامر build/start خاصة بـNixpacks؛ Dockerfile يبني المشروع ويبدأ الخادم بنفسه. يستمع الخادم على `0.0.0.0:3000`، ويعمل بحساب `node` ذي UID/GID `1000`.

## 3. متغيرات التشغيل

أضف القيم التالية كمتغيرات **Runtime** في Coolify، وليس Build Arguments:

```dotenv
HARKA_PUBLIC_ORIGIN=https://haraka.seif4d.com
HARKA_DATABASE_PATH=/app/.data/harka.sqlite
HARKA_SETUP_TOKEN=
```

استبدل قيمة `HARKA_SETUP_TOKEN` برمز عشوائي خاص بك. لتوليده على جهازك الحالي داخل Terminal فيه Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

انسخ الناتج إلى Coolify فقط، ولا تضعه في GitHub أو لقطات الشاشة. ستستخدمه مرة عند إنشاء حساب الإدارة؛ يظل موجودًا في إعدادات التشغيل بعد ذلك. رمز الإعداد مختلف عن كلمة مرور حساب المدير.

القيم `NODE_ENV=production` و`PORT=3000` و`TZ=Africa/Cairo` مضبوطة بالفعل في الصورة. العنوان الخارجي يُستخدم للتحقق من أصل الطلبات وضبط Cookie الجلسة بعلامة Secure، دون الوثوق بترويسات forwarded التي قد يرسلها العميل.

## 4. التخزين الدائم — قبل أول Deploy

في **Persistent Storage** أضف **Volume Mount**:

| الحقل | القيمة |
| --- | --- |
| Name | `harka-data` |
| Destination Path | `/app/.data` |
| Source Path | اتركه فارغًا لاستخدام Docker volume |

يجب حفظ **المجلد كاملًا**، لأن SQLite يستخدم ملفات WAL/SHM بجانب القاعدة. الحسابات والدروس والملفات المرفوعة والتسليمات والنتائج كلها محفوظة في قاعدة البيانات. لا تربط `/app` أو `.next` كتخزين دائم. [مرجع التخزين](https://coolify.io/docs/applications/configuration/persistent-storage)

صورة الإنتاج ترفض الإقلاع إذا كان مجلد قاعدة البيانات خارج mount دائم، وتظهر رسالة `No persistent storage mounted`. هذا يمنع بدء قاعدة مؤقتة تختفي بعد استبدال الحاوية. لا تغيّر اسم الـvolume أو مساره بين التحديثات؛ وجود mount جديد فارغ لا يسترجع بيانات volume سابق.

إذا نُشر التطبيق بالفعل دون تخزين دائم، لا تضف volume فارغًا ثم تعيد النشر مباشرة. احفظ نسخة SQLite متسقة من الحاوية الحالية خارجها أولًا، وانقلها إلى التخزين الدائم قبل استبدال الحاوية. الحسابات الموجودة داخل حاوية حُذفت قد لا يمكن استرجاعها دون نسخة احتياطية أو Snapshot سابق للخادم.

لو اخترت bind mount بدل volume، جهّز المجلد على الخادم بصلاحية قراءة وكتابة للمستخدم `1000:1000`. لا تستخدم نفس volume لتجارب Preview أو لنسخ تطبيقات مختلفة، ولا تحذف volume عند إعادة النشر.

## 5. الفحص والنشر

الصورة تحتوي health check جاهزًا. لو ستضبط HTTP Healthcheck في Coolify يدويًا:

| الإعداد | القيمة |
| --- | --- |
| Method | `GET` |
| Scheme داخل الحاوية | `http` |
| Port | `3000` |
| Path | `/api/health` |
| Expected status | `200` |

اضغط **Deploy**، ثم تحقق من `https://haraka.seif4d.com/api/health`؛ النتيجة الطبيعية `{"status":"ok"}`. [مرجع Health Checks](https://coolify.io/docs/applications/configuration/health-checks)

بعدها افتح `https://haraka.seif4d.com/setup`، وأدخل رمز الإعداد وأنشئ حساب الإدارة الخاص بك. يُغلق إعداد الإدارة بعد إنشاء الحساب الأول. سجّل حساب طالب وجرّب الدخول ورفع ملف، ثم أعد النشر وتأكد أن البيانات موجودة.

القاعدة الجديدة على الخادم تبدأ فارغة؛ قاعدة جهازك لا تدخل صورة Docker ولا تُرفع إلى GitHub.

## 6. إدخال جداول الفرقة الثالثة

بعد إعداد المدير، افتح **Terminal** داخل حاوية التطبيق في Coolify وشغّل:

```sh
node scripts/import-third-year-schedules.cjs
```

يضيف الأمر الجداول الستة للترم الأول 2026/2027. شغّله مرة عند البداية؛ إعادة تشغيله تستبدل التعديلات اليدوية على هذه الجداول. لا تجعله Post-deployment Command تلقائيًا. بقية المحتوى يُضاف من لوحة الإدارة.

## 7. النسخ الاحتياطي

من Terminal حاوية التطبيق:

```sh
node scripts/backup-database.cjs
```

يطبع الأمر مسار نسخة SQLite متسقة داخل `/app/.data/backups/`، ويمكن تشغيله أثناء عمل التطبيق. احتفظ بنسخة خارج الـVPS أيضًا؛ التخزين الدائم وحده ليس نسخة احتياطية. لا تنسخ ملف SQLite النشط وحده وتتجاهل WAL.

## اختبارات التجهيز

```sh
npm run typecheck
npm test
```

تغطي الاختبارات HTTPS خلف بروكسي HTTP، رمز أول مدير، Cookies، طلبات JSON ورفع الملفات، رفض المصادر غير المسموحة، واستمرار الحسابات والملفات بعد إعادة تشغيل الخادم. مهمة **Production container** على GitHub تبني Dockerfile وتشغّل صورة الإنتاج كمستخدم غير root، وتختبر استيراد الجداول والنسخ الاحتياطي واستمرار البيانات بعد حذف الحاوية وإنشاء أخرى بنفس volume. بيانات هذه الاختبارات منفصلة ومؤقتة.

لإعادة اختبار الصورة على جهاز يحتوي Docker:

```sh
docker build -t haraka:ci .
npm run test:container
```
