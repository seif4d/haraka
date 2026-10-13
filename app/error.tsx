"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & {digest?:string}; reset: ()=>void }) {
  return <div className="harka-shell"><main className="auth-card not-found"><span className="tag lilac">حصل عطل في تحميل الصفحة</span><h1>نحاول مرة كمان؟</h1><p>تعذر تحميل البيانات الآن. جرّب إعادة المحاولة، أو ارجع للصفحة الرئيسية.</p><div className="form-actions"><button className="button dark-button" onClick={reset}>إعادة المحاولة</button><Link className="button outline-button" href="/">الصفحة الرئيسية</Link></div></main></div>;
}
