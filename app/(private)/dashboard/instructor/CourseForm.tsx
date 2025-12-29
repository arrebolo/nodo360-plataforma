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

  return (
    <form
      className="space-y-4"
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-sm font-medium">Título</label>
        <input
          className="rounded-xl border px-3 py-2"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Slug</label>
        <input
          className="rounded-xl border px-3 py-2"
          value={form.slug}
          onChange={(e) => update("slug", e.target.value)}
          placeholder="introduccion-a-bitcoin"
          required
        />
        <p className="text-xs text-muted-foreground">
          Solo minúsculas, guiones y números. Debe ser único.
        </p>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          className="rounded-xl border px-3 py-2 min-h-[110px]"
          value={form.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Nivel</label>
          <select
            className="rounded-xl border px-3 py-2"
            value={form.level}
            onChange={(e) => update("level", e.target.value as any)}
          >
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Estado</label>
          <select
            className="rounded-xl border px-3 py-2"
            value={form.status}
            onChange={(e) => update("status", e.target.value as any)}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="coming_soon">coming_soon</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <input
            id="is_free"
            type="checkbox"
            checked={form.is_free}
            onChange={(e) => update("is_free", e.target.checked)}
          />
          <label htmlFor="is_free" className="text-sm font-medium">
            Curso gratuito
          </label>
        </div>

        {!form.is_free && (
          <div className="grid gap-2">
            <label className="text-sm font-medium">Precio (€)</label>
            <input
              type="number"
              className="rounded-xl border px-3 py-2"
              value={form.price ?? ""}
              onChange={(e) => update("price", e.target.value ? Number(e.target.value) : null)}
              min={0}
              step={1}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
