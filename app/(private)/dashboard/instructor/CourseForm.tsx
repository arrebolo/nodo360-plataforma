"use client";

import React, { useState, useTransition } from "react";

type Props = {
  initial?: {
    title: string;
    slug: string;
    description?: string | null;
    level: "beginner" | "intermediate" | "advanced";
    status: "draft" | "published" | "archived" | "coming_soon";
    is_free: boolean;
    price?: number | null;
  };
  onSave: (payload: any) => Promise<void>;
};

export default function CourseForm({ initial, onSave }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    level: initial?.level ?? "beginner",
    status: initial?.status ?? "draft",
    is_free: initial?.is_free ?? true,
    price: initial?.price ?? null,
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
              ...form,
              description: form.description?.trim() ? form.description : null,
              price: form.is_free ? null : form.price ?? null,
            };
            await onSave(payload);
          } catch (err: any) {
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
          Solo minúsculas, guiones y números. Debe ser único.
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

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label className={labelClasses}>Nivel *</label>
          <select
            className={selectClasses}
            value={form.level}
            onChange={(e) => update("level", e.target.value as any)}
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
            onChange={(e) => update("status", e.target.value as any)}
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-brand-light to-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90 hover:shadow-lg hover:shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isPending ? "Guardando..." : "Guardar curso"}
      </button>
    </form>
  );
}
