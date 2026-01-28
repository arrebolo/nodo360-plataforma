"use client";

import React, { useState, useTransition } from "react";
import { LearningPathSelect } from "./LearningPathSelect";

type CourseLevel = "beginner" | "intermediate" | "advanced";
type CourseStatus = "draft" | "published" | "pending_review" | "rejected" | "archived" | "coming_soon";

type Initial = {
  title: string;
  slug: string;
  description?: string | null;
  level: CourseLevel;
  status: CourseStatus;
  is_free: boolean;
  price?: number | null;
  thumbnail_url?: string | null;
  banner_url?: string | null;
};

type Props = {
  initial?: Initial;
  courseId?: string;
  /** Si true, el botón mostrará advertencia de re-aprobación */
  isPublished?: boolean;
  onSave: (payload: {
    title: string;
    slug: string;
    description: string | null;
    level: CourseLevel;
    status: CourseStatus;
    is_free: boolean;
    price: number | null;
    thumbnail_url: string | null;
    banner_url: string | null;
  }) => Promise<void>;
};

export default function CourseForm({ initial, courseId, isPublished, onSave }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    level: (initial?.level ?? "beginner") as CourseLevel,
    status: (initial?.status ?? "draft") as CourseStatus,
    is_free: initial?.is_free ?? true,
    price: initial?.price ?? null,
    thumbnail_url: initial?.thumbnail_url ?? "",
    banner_url: initial?.banner_url ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  const inputClasses = "w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white placeholder:text-white/40 focus:border-brand-light/50 focus:outline-none focus:ring-1 focus:ring-brand-light/30 transition";
  const selectClasses = "w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-white focus:border-brand-light/50 focus:outline-none focus:ring-1 focus:ring-brand-light/30 transition cursor-pointer";
  const labelClasses = "text-sm font-medium text-white/80";

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);

        startTransition(async () => {
          try {
            const payload = {
              title: form.title.trim(),
              slug: form.slug.trim(),
              description: form.description?.trim() ? form.description.trim() : null,
              level: form.level,
              status: form.status,
              is_free: form.is_free,
              price: form.is_free ? null : form.price ?? null,
              thumbnail_url: form.thumbnail_url?.trim() || null,
              banner_url: form.banner_url?.trim() || null,
            };

            if (!payload.title) throw new Error("El título es obligatorio.");
            if (!payload.slug) throw new Error("El slug es obligatorio.");

            await onSave(payload);
          } catch (err: any) {
            // Ignorar errores de redirect de Next.js
            if (err?.digest?.includes('NEXT_REDIRECT')) {
              return;
            }
            setError(err?.message ?? "Error guardando");
          }
        });
      }}
    >
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-2">
        <label className={labelClasses}>Título *</label>
        <input
          className={inputClasses}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Ej: Introducción a Bitcoin"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className={labelClasses}>Slug *</label>
        <input
          className={inputClasses}
          value={form.slug}
          onChange={(e) => update("slug", e.target.value)}
          placeholder="introduccion-a-bitcoin"
          required
        />
        <p className="text-xs text-white/50">
          Solo minúsculas, números y guiones. Debe ser único.
        </p>
      </div>

      <div className="grid gap-2">
        <label className={labelClasses}>Descripción</label>
        <textarea
          className={`${inputClasses} min-h-[120px] resize-none`}
          value={form.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Describe brevemente el contenido del curso..."
        />
      </div>

      {/* Selector de Ruta de Aprendizaje (solo en edicion) */}
      {courseId && <LearningPathSelect courseId={courseId} />}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label className={labelClasses}>Nivel *</label>
          <select
            className={selectClasses}
            value={form.level}
            onChange={(e) => update("level", e.target.value as CourseLevel)}
            style={{ colorScheme: 'dark' }}
          >
            <option value="beginner" className="bg-[#0d1117] text-white">Principiante</option>
            <option value="intermediate" className="bg-[#0d1117] text-white">Intermedio</option>
            <option value="advanced" className="bg-[#0d1117] text-white">Avanzado</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className={labelClasses}>Estado *</label>
          <select
            className={selectClasses}
            value={form.status}
            onChange={(e) => update("status", e.target.value as CourseStatus)}
            style={{ colorScheme: 'dark' }}
          >
            <option value="draft" className="bg-[#0d1117] text-white">Borrador</option>
            <option value="published" className="bg-[#0d1117] text-white">Publicado</option>
            <option value="coming_soon" className="bg-[#0d1117] text-white">Próximamente</option>
            <option value="archived" className="bg-[#0d1117] text-white">Archivado</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <input
            id="is_free"
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => update("is_free", e.target.checked)}
            className="w-5 h-5 rounded border-white/20 bg-[#0d1117] text-brand-light focus:ring-2 focus:ring-brand-light/30 cursor-pointer"
          />
          <label htmlFor="is_free" className="text-sm font-medium text-white cursor-pointer">
            Curso gratuito
          </label>
        </div>

        {!form.is_free && (
          <div className="grid gap-2">
            <label className={labelClasses}>Precio (€)</label>
            <input
              type="number"
              className={inputClasses}
              value={form.price ?? ""}
              onChange={(e) => update("price", e.target.value ? Number(e.target.value) : null)}
              min={0}
              step={1}
              placeholder="29"
            />
          </div>
        )}
      </div>

      {/* Sección de Imágenes */}
      <div className="space-y-5 pt-5 border-t border-white/10">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Imágenes del curso
        </h3>

        {/* Thumbnail */}
        <div className="grid gap-2">
          <label className={labelClasses}>
            Imagen de portada (Thumbnail)
          </label>
          <p className="text-xs text-white/40">
            Se muestra en el catálogo de cursos. Recomendado: 1280x720px (16:9)
          </p>

          {form.thumbnail_url && (
            <div className="mt-2 mb-1">
              <img
                src={form.thumbnail_url}
                alt="Thumbnail actual"
                className="w-full max-w-sm h-36 object-cover rounded-xl border border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <input
            type="url"
            className={inputClasses}
            value={form.thumbnail_url}
            onChange={(e) => update("thumbnail_url", e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
          />
        </div>

        {/* Banner */}
        <div className="grid gap-2">
          <label className={labelClasses}>
            Imagen de cabecera (Banner)
            <span className="text-white/40 ml-1 font-normal">(opcional)</span>
          </label>
          <p className="text-xs text-white/40">
            Se muestra en la página del curso. Recomendado: 1920x400px
          </p>

          {form.banner_url && (
            <div className="mt-2 mb-1">
              <img
                src={form.banner_url}
                alt="Banner actual"
                className="w-full max-w-sm h-20 object-cover rounded-xl border border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <input
            type="url"
            className={inputClasses}
            value={form.banner_url}
            onChange={(e) => update("banner_url", e.target.value)}
            placeholder="https://ejemplo.com/banner.jpg"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`w-full sm:w-auto rounded-xl px-6 py-3 text-sm font-semibold text-white hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition ${
          isPublished
            ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-amber-500/20"
            : "bg-gradient-to-r from-brand-light to-brand hover:shadow-brand/20"
        }`}
      >
        {isPending
          ? "Guardando..."
          : isPublished
            ? "Guardar (requiere re-aprobación)"
            : "Guardar curso"}
      </button>
    </form>
  );
}
