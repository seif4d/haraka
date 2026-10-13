export async function api<T = Record<string, unknown>>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const response = await fetch(`/api/${path}`, { method, headers: { "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "تعذر إتمام العملية. حاول مرة أخرى.");
  return data as T;
}
