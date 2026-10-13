import { requireUser } from "@/lib/server/auth";
export default async function Layout({ children }: { children: React.ReactNode }) { await requireUser("admin"); return children; }
