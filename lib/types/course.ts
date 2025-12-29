// lib/types/course.ts
import type { Database } from "@/lib/supabase/types";

export type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type CourseOwner = Pick<UserRow, "id" | "full_name" | "avatar_url" | "role">;

export type CourseWithOwner = CourseRow & {
  owner: CourseOwner | null;
};

// Compat temporal (si aún hay código público que pide instructor)
export type CourseWithInstructor = CourseRow & {
  instructor: CourseOwner | null;
};
