import Link from "next/link";
import { requireUser } from "@/lib/server/auth";
import { PublicHeader } from "@/components/public-site";
export default async function Page() {
  const user = await requireUser("instructor");
  return <div className="harka-shell"><PublicHeader user={user}/><main className="auth-card"><h1>مساحة الدكاترة</h1><p>الدور محجوز في هيكل المنصة. واجهة التدريس لم تُفعّل بعد.</p><Link href="/">العودة للصفحة العامة</Link></main></div>;
}
