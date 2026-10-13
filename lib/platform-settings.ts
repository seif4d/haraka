export type PlatformSettings = {
  pageTitle: string;
  description: string;
  supportEmail: string;
  registrationOpen: boolean;
  announcementEnabled: boolean;
  announcement: string;
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  pageTitle: "حركة — افهمها. جرّبها. ثبّتها.",
  description: "المادة مش مجرد كلام يتحفظ. هنا بنبدأ بسؤال، نفهم الفكرة، ونجرّبها… لحد ما تقول: «آه، فهمت!»",
  supportEmail: "",
  registrationOpen: true,
  announcementEnabled: false,
  announcement: "",
};

export function validatePlatformSettings(input: Record<string, unknown>): PlatformSettings {
  const keys = Object.keys(DEFAULT_PLATFORM_SETTINGS);
  if (Object.keys(input).some(key => !keys.includes(key))) throw new Error("الإعدادات المرسلة غير معروفة.");
  const read = (key: string, min: number, max: number) => {
    const value = input[key];
    if (typeof value !== "string" || value.trim().length < min || value.length > max) throw new Error("راجع الحقول المطلوبة وأطوال النصوص.");
    return value.trim();
  };
  if (typeof input.registrationOpen !== "boolean" || typeof input.announcementEnabled !== "boolean") throw new Error("راجع حالة التسجيل والإعلان.");
  const supportEmail = read("supportEmail", 0, 254);
  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) throw new Error("اكتب بريد تواصل صحيحًا.");
  const announcement = read("announcement", 0, 400);
  if (input.announcementEnabled && !announcement) throw new Error("اكتب الإعلان قبل تفعيله.");
  return { pageTitle: read("pageTitle", 2, 100), description: read("description", 10, 350), supportEmail, registrationOpen: input.registrationOpen, announcementEnabled: input.announcementEnabled, announcement };
}
