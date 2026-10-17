import { DEFAULT_PROFILE, coursesFor, type Course, type Profile, type Track } from "./curriculum.ts";

export function allCurriculum(): Course[] {
  const map = new Map<string, Course>();
  for (const year of [1, 2, 3, 4]) for (const gender of ["boys", "girls"] as const) for (const semester of [1, 2]) {
    const tracks: Track[] = year < 3 ? ["general"] : ["teaching", "training", "management"];
    for (const track of tracks) coursesFor({ ...DEFAULT_PROFILE, year, gender, semester, track }).forEach(course => map.set(course.id, course));
  }
  return Array.from(map.values());
}
export const catalog = allCurriculum();
const profiles = new Map<string, Profile>();
for (const year of [1, 2, 3, 4]) for (const gender of ["boys", "girls"] as const) for (const semester of [1, 2]) {
  for (const track of (year < 3 ? ["general"] : ["teaching", "training", "management"]) as Track[]) {
    const profile = { ...DEFAULT_PROFILE, year, gender, semester, track };
    for (const course of coursesFor(profile)) profiles.set(course.id, profile);
  }
}
export function profileForCourse(id: string) { return profiles.get(id); }
