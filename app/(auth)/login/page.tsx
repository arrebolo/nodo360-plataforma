import type { Metadata } from "next";
import LoginContent from "./LoginContent";

// Un formulario de acceso no tiene nada que indexar. Hasta ahora no habia
// ningun metadata en (auth), asi que /login heredaba el index: true del layout
// raiz: era indexable, y ademas era la pagina en la que acababan los
// rastreadores que seguian una URL de /rutas/... follow queda en true para que
// los enlaces de la pagina se sigan recorriendo.
export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginContent />;
}


