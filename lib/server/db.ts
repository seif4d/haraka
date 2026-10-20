import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { syncSharedContent } from "./shared-content";
import { syncLegacyUnits } from "./course-units";

import { academySchema } from "./academy-schema";

const globalDb = globalThis as unknown as { harkaDb?: DatabaseSync };
export function db() {
  if (globalDb.harkaDb) return globalDb.harkaDb;
  const path = resolve(/* turbopackIgnore: true */ process.env.HARKA_DATABASE_PATH || ".data/harka.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','student','instructor')),
      profile TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY, course_id TEXT NOT NULL, title TEXT NOT NULL, intro TEXT NOT NULL,
      body TEXT NOT NULL, youtube_url TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','published')),
      author_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL,
      PRIMARY KEY(user_id,course_id)
    );
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL,
      completed_at TEXT NOT NULL, PRIMARY KEY(user_id,lesson_id)
    );
    CREATE TABLE IF NOT EXISTS auth_attempts (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id TEXT NOT NULL, action TEXT NOT NULL,
      entity_id TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS specializations (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL,
      sport_id TEXT NOT NULL, PRIMARY KEY(user_id,course_id)
    );
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY, cohort_key TEXT NOT NULL UNIQUE, academic_year TEXT NOT NULL,
      source_label TEXT NOT NULL, source_url TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','published')),
      entries TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL,
      mime TEXT NOT NULL, size INTEGER NOT NULL, purpose TEXT NOT NULL CHECK(purpose IN ('material','submission')),
      assignment_id TEXT, data BLOB NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS library_items (
      id TEXT PRIMARY KEY, course_id TEXT NOT NULL, sport_id TEXT NOT NULL, title TEXT NOT NULL,
      description TEXT NOT NULL, kind TEXT NOT NULL, source TEXT NOT NULL, url TEXT NOT NULL,
      file_id TEXT REFERENCES files(id), status TEXT NOT NULL CHECK(status IN ('draft','published')),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY, course_id TEXT NOT NULL, sport_id TEXT NOT NULL, title TEXT NOT NULL,
      instructions TEXT NOT NULL, requester TEXT NOT NULL, due_at TEXT NOT NULL, max_score REAL NOT NULL,
      file_id TEXT REFERENCES files(id), status TEXT NOT NULL CHECK(status IN ('draft','published')),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id), user_id TEXT NOT NULL REFERENCES users(id),
      text TEXT NOT NULL, url TEXT NOT NULL, file_id TEXT REFERENCES files(id), submitted_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('submitted','returned','graded')), score REAL, feedback TEXT NOT NULL,
      reviewed_at TEXT, UNIQUE(assignment_id,user_id)
    );
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY, course_id TEXT NOT NULL, sport_id TEXT NOT NULL, title TEXT NOT NULL,
      instructions TEXT NOT NULL, duration_minutes INTEGER NOT NULL, attempt_limit INTEGER NOT NULL,
      pass_percent INTEGER NOT NULL, opens_at TEXT, closes_at TEXT, questions TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft','published')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exam_attempts (
      id TEXT PRIMARY KEY, exam_id TEXT NOT NULL REFERENCES exams(id), user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL, questions TEXT NOT NULL, pass_percent INTEGER NOT NULL, answers TEXT NOT NULL,
      started_at TEXT NOT NULL, ends_at TEXT NOT NULL, submitted_at TEXT,
      status TEXT NOT NULL CHECK(status IN ('in_progress','submitted','expired')), score REAL, total REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS attempts_owner ON exam_attempts(user_id,exam_id);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt ON exam_attempts(user_id,exam_id) WHERE status='in_progress';
  `);
  if(!database.prepare("PRAGMA table_info(lessons)").all().some(row=>row.name==="sport_id")) database.exec("ALTER TABLE lessons ADD COLUMN sport_id TEXT NOT NULL DEFAULT ''");
  const scheduleColumns=database.prepare("PRAGMA table_info(schedules)").all();
  if(!scheduleColumns.some(row=>row.name==="notes"))database.exec("ALTER TABLE schedules ADD COLUMN notes TEXT NOT NULL DEFAULT ''");
  if(!scheduleColumns.some(row=>row.name==="day_notes"))database.exec("ALTER TABLE schedules ADD COLUMN day_notes TEXT NOT NULL DEFAULT '{}'");
  if(!database.prepare("PRAGMA table_info(lessons)").all().some(row=>row.name==="structure"))database.exec("ALTER TABLE lessons ADD COLUMN structure TEXT NOT NULL DEFAULT '{}'");
  database.exec(`CREATE TABLE IF NOT EXISTS lesson_visits (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL, visited_at TEXT NOT NULL, PRIMARY KEY(user_id,course_id)
  );
  CREATE TABLE IF NOT EXISTS platform_settings (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS course_units (id TEXT PRIMARY KEY,course_id TEXT NOT NULL,title TEXT NOT NULL,position INTEGER NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS content_aliases(entity TEXT NOT NULL CHECK(entity IN ('lesson','unit')),alias_id TEXT NOT NULL,canonical_id TEXT NOT NULL,PRIMARY KEY(entity,alias_id));
  CREATE INDEX IF NOT EXISTS aliases_canonical ON content_aliases(entity,canonical_id);
  CREATE INDEX IF NOT EXISTS units_course ON course_units(course_id,position);`);
  if(!database.prepare("PRAGMA table_info(lessons)").all().some(row=>row.name==="unit_id"))database.exec("ALTER TABLE lessons ADD COLUMN unit_id TEXT NOT NULL DEFAULT ''");
  database.exec('BEGIN IMMEDIATE');
  try{syncLegacyUnits(database);syncSharedContent(database);academySchema(database);database.exec('PRAGMA user_version=9;COMMIT');}catch(error){database.exec('ROLLBACK');database.close();throw error;}
  globalDb.harkaDb = database;
  return database;
}
export function transaction<T>(work: () => T): T {
  db().exec("BEGIN IMMEDIATE");
  try { const value = work(); db().exec("COMMIT"); return value; }
  catch (error) { db().exec("ROLLBACK"); throw error; }
}
export function hasAdmin() { return !!db().prepare("SELECT 1 FROM users WHERE role='admin' LIMIT 1").get(); }
export function audit(actorId: string, action: string, entityId: string) {
  db().prepare("INSERT INTO audit_log(actor_id,action,entity_id,created_at) VALUES(?,?,?,?)").run(actorId, action, entityId, new Date().toISOString());
}
