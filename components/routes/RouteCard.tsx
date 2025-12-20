import Link from "next/link";

type RouteCardProps = {
  slug: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  icon?: string | null;
  course_count?: number;
};

export function RouteCard(props: RouteCardProps) {
  const icon = props.icon || "🎯";
  const description = props.short_description || props.description || "Explora esta ruta de aprendizaje.";

  return (
    <Link
      href={`/rutas/${props.slug}`}
      className="group block p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-orange-500/30 transition-all duration-300"
    >
      <div className="flex gap-4">
        {/* Icono */}
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#ff6b35]/20 to-[#f7931a]/20 border border-orange-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">
            {props.title}
          </h3>

          <p className="mt-1 text-sm text-neutral-400 line-clamp-2">
            {description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {props.course_count !== undefined ? `${props.course_count} cursos` : "Ver cursos"}
            </span>
            <span className="text-sm text-neutral-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all">
              Entrar →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
