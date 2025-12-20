import Link from "next/link";

type CourseCardV2Props = {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  banner_url?: string | null;
  thumbnail_url?: string | null;
  is_free?: boolean | null;
  is_premium?: boolean | null;
  level?: string | null;
};

function getPrimaryImage(course: CourseCardV2Props) {
  return course.banner_url || course.thumbnail_url || null;
}

function getPricingBadge(course: CourseCardV2Props) {
  if (course.is_premium) return { label: "Premium", color: "from-purple-500 to-purple-600" };
  if (course.is_free) return { label: "Gratis", color: "from-green-500 to-green-600" };
  return { label: "Curso", color: "from-neutral-500 to-neutral-600" };
}

function getLevelBadge(level: string | null | undefined) {
  if (!level) return null;
  const labels: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  };
  return labels[level] || level;
}

export function CourseCardV2(props: CourseCardV2Props) {
  const img = getPrimaryImage(props);
  const pricing = getPricingBadge(props);
  const levelLabel = getLevelBadge(props.level);

  return (
    <Link
      href={`/cursos/${props.slug}`}
      className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
    >
      {/* Titulo arriba */}
      <div className="px-4 pt-4">
        <h3 className="text-sm font-semibold text-white line-clamp-2 min-h-[40px]">
          {props.title}
        </h3>
      </div>

      {/* Imagen con badges */}
      <div className="px-4 pt-3">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a]">
          {/* Badges */}
          <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium text-white bg-gradient-to-r ${pricing.color} shadow-lg`}>
              {pricing.label}
            </span>
            {levelLabel && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white/90 bg-black/50 backdrop-blur-sm border border-white/10">
                {levelLabel}
              </span>
            )}
          </div>

          {/* Imagen o placeholder */}
          {img ? (
            <img
              src={img}
              alt={props.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f7931a] flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>

      {/* Descripcion y CTA */}
      <div className="px-4 pt-3 pb-4">
        <p className="text-xs text-neutral-400 line-clamp-2 min-h-[32px]">
          {props.subtitle || props.description || "Aprende los conceptos fundamentales de este tema."}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-400 group-hover:text-orange-400 transition-colors">
            Ver curso
          </span>
          <span className="text-neutral-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
