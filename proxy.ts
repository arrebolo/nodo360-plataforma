import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  console.log("🔍 [Proxy] Request to:", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // 🔐 Obtener sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // ============================
  // 🔒 PROTECCIÓN DE RUTAS
  // ============================

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/recuperar-password") ||
    pathname.startsWith("/restablecer-password") ||
    pathname.startsWith("/auth/callback");

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/cursos") ||
    pathname.startsWith("/sobre-nosotros") ||
    pathname.startsWith("/comunidad") ||
    pathname.startsWith("/mentoria") ||
    pathname.startsWith("/proyectos") ||
    pathname.startsWith("/verificar");

  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // 🔁 Usuario NO autenticado intentando acceder a zona privada
  if (!session && (isAdminRoute || isDashboardRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🔁 Usuario autenticado intentando acceder a login/registro
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

// ============================
// 🎯 MATCHER (rutas afectadas)
// ============================
export const config = {
  matcher: [
    /*
      Ejecuta el proxy en todas las rutas
      excepto assets estáticos y API internas
    */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

