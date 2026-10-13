import "server-only";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { homeFor, type Role, type User } from "../domain";
import { normalizeProfile } from "../curriculum";

const scrypt = promisify(scryptCallback);
const COOKIE = "harka_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
type Row = { id: string; email: string; role: Role; profile: string; active: number; created_at: string; password_hash?: string };
export function publicUser(row: Row): User {
  return { id: row.id, email: row.email, role: row.role, profile: normalizeProfile(JSON.parse(row.profile)), active: !!row.active, createdAt: row.created_at };
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await scrypt(password, salt, 64) as Buffer).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [, salt, key] = encoded.split(":");
  const actual = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(key, "hex"));
}
export async function createSession(userId: string, secure: boolean) {
  const jar = await cookies();
  const old = jar.get(COOKIE)?.value;
  if (old) db().prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(old));
  db().prepare("DELETE FROM sessions WHERE expires_at<=?").run(Date.now());
  const token = randomBytes(32).toString("hex");
  db().prepare("INSERT INTO sessions VALUES(?,?,?)").run(hash(token), userId, Date.now() + SESSION_SECONDS * 1000);
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: SESSION_SECONDS });
}
export async function endSession() {
  const jar = await cookies(); const token = jar.get(COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
  jar.delete(COOKIE);
}
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const row = db().prepare("SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1").get(hash(token), Date.now()) as Row | undefined;
  return row ? publicUser(row) : null;
}
export async function requireUser(role?: Role) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(homeFor(user.role));
  return user;
}
export function authLimit(key: string) {
  const now = Date.now();
  db().prepare("DELETE FROM auth_attempts WHERE reset_at<=?").run(now);
  const row = db().prepare("SELECT attempts FROM auth_attempts WHERE key=?").get(key) as { attempts: number } | undefined;
  if (row && row.attempts >= 10) return false;
  db().prepare("INSERT INTO auth_attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1").run(key, now + 15 * 60 * 1000);
  return true;
}
