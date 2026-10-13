/** Use an explicitly configured public URL behind a TLS-terminating proxy.
 * Forwarded headers never decide which browser origins may write to the app. */
export function parsePublicOrigin(value:string):string {
  let parsed:URL;
  try { parsed=new URL(value); } catch { throw new Error("HARKA_PUBLIC_ORIGIN must be a complete http(s) origin."); }
  if(!["http:","https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname!=="/" || parsed.search || parsed.hash)throw new Error("HARKA_PUBLIC_ORIGIN must contain only protocol and hostname, without a path or credentials.");
  return parsed.origin;
}
export function requestOrigin(request:{url:string},configured=process.env.HARKA_PUBLIC_ORIGIN):string {
  return configured?parsePublicOrigin(configured):new URL(request.url).origin;
}
export function sameOrigin(request:{url:string;headers:Headers},configured=process.env.HARKA_PUBLIC_ORIGIN):boolean {
  return request.headers.get("origin")===requestOrigin(request,configured);
}
export function secureSession(request:{url:string},configured=process.env.HARKA_PUBLIC_ORIGIN):boolean {
  return new URL(requestOrigin(request,configured)).protocol==="https:";
}
