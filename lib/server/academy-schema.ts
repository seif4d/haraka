import type { DatabaseSync } from "node:sqlite";
export function academySchema(database:DatabaseSync){database.exec(`
CREATE TABLE IF NOT EXISTS academy_courses (
 id TEXT PRIMARY KEY,title TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),
 metadata TEXT NOT NULL,cover_id TEXT REFERENCES files(id),revision INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS academy_units (
 id TEXT PRIMARY KEY,course_id TEXT NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
 title TEXT NOT NULL,position INTEGER NOT NULL,UNIQUE(id,course_id)
);
CREATE INDEX IF NOT EXISTS academy_unit_order ON academy_units(course_id,position);
CREATE TABLE IF NOT EXISTS academy_lessons (
 id TEXT PRIMARY KEY,course_id TEXT NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
 unit_id TEXT NOT NULL,title TEXT NOT NULL,intro TEXT NOT NULL,youtube_id TEXT NOT NULL,
 blocks TEXT NOT NULL,duration INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published')),
 position INTEGER NOT NULL,revision INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,
 FOREIGN KEY(unit_id,course_id) REFERENCES academy_units(id,course_id),UNIQUE(id,course_id)
);
CREATE INDEX IF NOT EXISTS academy_lesson_order ON academy_lessons(course_id,unit_id,position);
CREATE TABLE IF NOT EXISTS academy_enrollments (
 course_id TEXT NOT NULL REFERENCES academy_courses(id),user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 enrolled_at TEXT NOT NULL,PRIMARY KEY(course_id,user_id)
);
CREATE TABLE IF NOT EXISTS academy_progress (
 course_id TEXT NOT NULL,user_id TEXT NOT NULL,lesson_id TEXT NOT NULL,
 completed_at TEXT,video_id TEXT NOT NULL DEFAULT '',seconds REAL NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL,PRIMARY KEY(user_id,lesson_id),
 FOREIGN KEY(course_id,user_id) REFERENCES academy_enrollments(course_id,user_id) ON DELETE CASCADE,
 FOREIGN KEY(lesson_id,course_id) REFERENCES academy_lessons(id,course_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS academy_attachments (
 lesson_id TEXT NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
 file_id TEXT NOT NULL REFERENCES files(id),PRIMARY KEY(lesson_id,file_id)
);
`);}
