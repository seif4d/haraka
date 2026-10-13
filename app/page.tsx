import type { Metadata } from "next";
import { platformSettings } from "@/lib/server/platform-settings";
import PublicSite from "@/components/public-site";
import { currentUser } from "@/lib/server/auth";
import { hasAdmin } from "@/lib/server/db";

export function generateMetadata(): Metadata {
  const settings=platformSettings();
  return {title:settings.pageTitle,description:settings.description,openGraph:{title:settings.pageTitle,description:settings.description}};
}

export default async function Page() {
  return <PublicSite user={await currentUser()} needsSetup={!hasAdmin()} settings={platformSettings()}/>;
}
