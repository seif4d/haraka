export function lessonLink(value:string){
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&value.length<=2048?url.href:null;}catch{return null;}
}
export function lessonVideoId(value:string){
  const safe=lessonLink(value);if(!safe)return null;const url=new URL(safe);const host=url.hostname.toLowerCase();
  const id=host==='youtu.be'?url.pathname.slice(1).split('/')[0]:['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)?url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]:null;
  return id&&/^[\w-]{11}$/.test(id)?id:null;
}
