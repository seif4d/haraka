import Link from "next/link";
export default function NotFound() { return <div className="harka-shell"><main className="auth-card not-found"><span className="tag lilac">404</span><h1>الصفحة مش هنا.</h1><p>المحتوى قد يكون غير منشور، أو الرابط تغيّر.</p><Link href="/" className="button dark-button">ارجع للبداية</Link></main></div>; }
