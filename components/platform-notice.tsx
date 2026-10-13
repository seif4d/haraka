import { Megaphone } from "lucide-react";

export default function PlatformNotice({text}:{text:string}) {
  return text ? <aside className="platform-notice" aria-label="إعلان المنصة"><Megaphone size={19}/><p>{text}</p></aside> : null;
}
