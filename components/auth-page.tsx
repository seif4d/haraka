import { redirect } from "next/navigation";
import Link from "next/link";
import AuthForm from "./auth-form";
import { PublicHeader } from "./public-site";
import { currentUser } from "@/lib/server/auth";
import { platformSettings } from "@/lib/server/platform-settings";
import { hasAdmin } from "@/lib/server/db";
import { homeFor } from "@/lib/domain";

export default async function AuthPage({ mode }: { mode: "login" | "register" | "setup" }) {
  const user = await currentUser(); if(user) redirect(homeFor(user.role));
  const settings=platformSettings();
  const configured = hasAdmin(); if(mode === "setup" && configured) redirect("/login");
  return <div className="harka-shell"><PublicHeader registrationOpen={settings.registrationOpen}/><main className="auth-layout"><aside className="auth-story"><span className="tiny-label">A LITTLE CURIOSITY. A LOT OF POSSIBILITY.</span><h2>خطوة في رحلتك.<br/><em>مساحة على مقاسك.</em></h2><p>موادك، شروحاتك، والحاجات اللي عايز ترجع لها. كلها بتبدأ من هنا.</p><div className="auth-story-mark" aria-hidden="true">↗</div><small>حركة · مساحة تعلّم مستقلة لعلوم الرياضة، أسيوط.</small></aside>{!configured && mode !== "setup" ? <section className="auth-card"><span className="tag lilac">لسه بنفتح الأبواب</span><h1>المنصة محتاجة أول خطوة.</h1><p>مالك المنصة يجهّز حساب الإدارة أولًا. بعدها يقدر الطلاب يسجّلوا ويبدأوا التعلّم.</p><Link className="button dark-button" href="/setup">إعداد حساب الإدارة</Link></section> : mode==="register" && !settings.registrationOpen ? <section className="auth-card"><span className="tag lilac">هنرجع نستقبل طلاب قريب</span><h1>التسجيل متوقف حاليًا.</h1><p>لو عندك حساب، تقدر تدخل وتكمّل تعلّمك كالمعتاد.</p><Link className="button dark-button" href="/login">ادخل لحسابك</Link></section> : <AuthForm mode={mode} registrationOpen={settings.registrationOpen} needsSetupToken={mode==="setup" && (process.env.NODE_ENV==="production" || !!process.env.HARKA_SETUP_TOKEN)}/>}</main></div>;
}
