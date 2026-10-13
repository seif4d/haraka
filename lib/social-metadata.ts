import type { Metadata } from "next";
import { parsePublicOrigin } from "./request-origin";

export function socialMetadata(title: string, description: string): Metadata {
  const origin = parsePublicOrigin(process.env.HARKA_PUBLIC_ORIGIN || "https://haraka.seif4d.com");
  const image = new URL("/brand/harka-share-v1.png", origin).href;
  const alt = "حركة — افهمها. جرّبها. ثبّتها. مساحة تعلّم علوم الرياضة بجامعة أسيوط";
  return {
    metadataBase: new URL(origin), title, description,
    openGraph: { title, description, siteName: "حركة", type: "website", locale: "ar_EG", url: origin, images: [{url:image, secureUrl:image, width:1200, height:630, type:"image/png", alt}] },
    twitter: {card:"summary_large_image", title, description, images:[{url:image,alt}]},
  };
}
