import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PRIVATE_PREFIXES = ["/dashboard", "/admin"];

const EXCLUDED_PATHS = [
  "/_next",
  "/api",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/imagenes",
  "/fonts",
  "/auth/callback",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1) Excluir estáticos/archivos
  if (EXCLUDED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  if (pathname.includes(".") && !pathname.endsWith("/")) {
    return NextResponse.next();
  }

  console.log("🔍 [Middleware] Request to:", pathname);

  // 2) Anti-loop: si vienes redirigido por middleware, no vuelvas a tocar nada
  const fromProxy = request.nextUrl.searchParams.get("_p");
  if (fromProxy === "1") {
    return NextResponse.next();
  }

  // 3) Defensa extra: solo privadas
  const isPrivateRoute = PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isPrivateRoute) {
    return NextResponse.next();
  }

  // 4) Crear cliente Supabase SSR
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 5) Obtener usuario
  const { data: { user } } = await supabase.auth.getUser();

  // 6) Privadas requieren auth
  if (!user) {
    console.log("🔒 [Middleware] Usuario no autenticado, redirigiendo a login");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("_p", "1");
    return NextResponse.redirect(loginUrl);
  }

  // 7) Guard ruta activa SOLO para /dashboard (NO para /admin) y excluyendo /dashboard/rutas
  const isDashboard = pathname.startsWith("/dashboard");
  const isDashboardRutas = pathname.startsWith("/dashboard/rutas");

  if (isDashboard && !isDashboardRutas) {
    try {
      const { data: activePath, error: activePathError } = await supabase
        .from("user_selected_paths")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (activePathError) {
        console.error("⚠️ [Middleware] Error verificando ruta activa:", activePathError.message);
      } else if (!activePath) {
        console.log("🔀 [Middleware] Usuario sin ruta activa, redirigiendo a /dashboard/rutas");
        const rutasUrl = new URL("/dashboard/rutas", request.url);
        rutasUrl.searchParams.set("_p", "1");
        return NextResponse.redirect(rutasUrl);
      }
    } catch (err) {
      console.error("⚠️ [Middleware] Error en guard de rutas:", err);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
