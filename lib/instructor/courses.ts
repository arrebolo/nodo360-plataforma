// lib/instructor/courses.ts
import { createClient } from "@/lib/supabase/server";

export type InstructorCourseForm = {
  title: string;
  slug: string;
  description?: string | null;
  level: "beginner" | "intermediate" | "advanced";
  status: "draft" | "published" | "archived" | "coming_soon";
  is_free: boolean;
  price?: number | null;
};

export async function listMyCourses(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, status, level, is_free, price, created_at")
    .eq("instructor_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createMyCourse(userId: string, payload: InstructorCourseForm) {
  const supabase = await createClient();

  const insertPayload = {
    ...payload,
    instructor_id: userId,
    price: payload.is_free ? null : payload.price ?? null,
  };

  const { data, error } = await supabase
    .from("courses")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getMyCourseForEdit(userId: string, courseId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select("id, title, slug, description, level, status, is_free, price")
    .eq("id", courseId)
    .eq("instructor_id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMyCourse(userId: string, courseId: string, payload: InstructorCourseForm) {
  const supabase = await createClient();

  const updatePayload = {
    ...payload,
    price: payload.is_free ? null : payload.price ?? null,
  };

  const { error } = await supabase
    .from("courses")
    .update(updatePayload)
    .eq("id", courseId)
    .eq("instructor_id", userId);

  if (error) throw new Error(error.message);
}
