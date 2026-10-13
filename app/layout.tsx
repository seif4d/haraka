import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const alexandria = localFont({
  src: [
    { path: "../public/fonts/alexandria-0.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/alexandria-1.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/alexandria-2.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/alexandria-3.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/alexandria-4.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-alexandria",
  display: "swap",
});

export const metadata: Metadata = {
  title: "حركة — افهمها. جرّبها. ثبّتها.",
  description: "مساحة تعليمية لطلاب علوم الرياضة بجامعة أسيوط. المواد، الدروس التفاعلية، وبطاقات المراجعة.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" className={alexandria.variable}><body>{children}</body></html>;
}
