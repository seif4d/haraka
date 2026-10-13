import "server-only";
import { db, transaction, audit } from "./db";
import { DEFAULT_PLATFORM_SETTINGS, type PlatformSettings, validatePlatformSettings } from "../platform-settings";

export function platformSettings(): PlatformSettings {
  const row = db().prepare("SELECT value FROM platform_settings WHERE id=1").get();
  return { ...DEFAULT_PLATFORM_SETTINGS, ...(row ? JSON.parse(String(row.value)) : {}) };
}

export function savePlatformSettings(input: Record<string, unknown>, actorId: string) {
  const settings = validatePlatformSettings(input);
  transaction(() => {
    db().prepare("INSERT INTO platform_settings(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").run(JSON.stringify(settings));
    audit(actorId, "update_settings", "platform");
  });
  return settings;
}
