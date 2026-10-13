import PublicSite from "@/components/public-site";
import { currentUser } from "@/lib/server/auth";
import { hasAdmin } from "@/lib/server/db";

export default async function Page() {
  return <PublicSite user={await currentUser()} needsSetup={!hasAdmin()}/>;
}
