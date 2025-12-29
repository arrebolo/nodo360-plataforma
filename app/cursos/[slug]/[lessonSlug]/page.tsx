// app/cursos/[slug]/[lessonSlug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import LessonPlayer from "@/components/lesson/LessonPlayer";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ slug: string; lessonSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  return {
    title: `${lessonSlug} | ${slug}`,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { slug: courseSlug, lessonSlug } = await params;

  const supabase = await createClient();

  // 1) Curso por slug (necesitamos ID real) + OWNER (mentor/instructor)
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(`
      id,
      slug,
      title,
      owner:users!courses_owner_id_fkey (
        id,
        full_name,
        avatar_url,
        role
      )
    `)
    .eq("slug", courseSlug)
    .single();

  if (courseError || !course) {
    console.error("❌ [LessonPage] Error cargando curso:", courseError?.message);
    notFound();
  }

  // 2) Lección por slug + course_id (necesitamos ID real)
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(
      `
      id,
      course_id,
      module_id,
      title,
      description,
      slug,
      order_index,
      video_url,
      slides_url,
      resources_url,
      pdf_url,
      content_json,
      created_at,
      updated_at
    `
    )
    .eq("slug", lessonSlug)
    .eq("course_id", course.id)
    .single();

  if (lessonError || !lesson) {
    console.error("❌ [LessonPage] Error cargando lección:", lessonError?.message);
    notFound();
  }

  // 3) Render: PASAMOS IDs REALES al LessonPlayer
  // Nota: por ahora no pasamos owner al LessonPlayer porque tu props actual solo requiere {id, slug, title}.
  // Si luego quieres mostrar autor en el LessonPlayer/Sidebar, ya lo tienes en `course.owner`.
  return (
    <LessonPlayer
      course={{
        id: course.id,
        slug: course.slug,
        title: course.title,
      }}
      lesson={{
        id: lesson.id,
        course_id: lesson.course_id,
        module_id: lesson.module_id,
        title: lesson.title,
        description: lesson.description,
        slug: lesson.slug,
        order_index: lesson.order_index,
        video_url: lesson.video_url,
        slides_url: lesson.slides_url,
        resources_url: lesson.resources_url,
        pdf_url: lesson.pdf_url,
        content_json: lesson.content_json,
      }}
    />
  );
}
