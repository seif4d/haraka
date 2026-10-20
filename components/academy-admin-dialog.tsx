"use client";
import {useEffect,useId,useRef,type ReactNode} from "react";
import {X} from "lucide-react";
import s from "./academy-admin.module.css";
export default function AcademyAdminDialog({title,description,busy=false,onClose,children}:{title:string;description?:string;busy?:boolean;onClose:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);const id=useId();
 useEffect(()=>{const origin=document.activeElement as HTMLElement|null;const old=document.body.style.overflow;ref.current?.showModal();document.body.style.overflow='hidden';return()=>{ref.current?.close();document.body.style.overflow=old;if(origin?.isConnected)origin.focus();};},[]);
 return <dialog ref={ref} className={s.dialog} aria-labelledby={id} aria-describedby={description?`${id}-description`:undefined} onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClick={e=>{if(e.target===ref.current&&!busy)onClose();}}><header><div><span className={s.eyebrow}>أكاديمية حركة</span><h2 id={id}>{title}</h2></div><button className={s.iconButton} type="button" aria-label="إغلاق النافذة" disabled={busy} onClick={onClose}><X size={20}/></button></header>{description&&<p id={`${id}-description`} className={s.dialogDescription}>{description}</p>}{children}</dialog>;
}
