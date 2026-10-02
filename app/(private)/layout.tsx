// app/(private)/layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getMiPerfil } from '@/lib/auth/miPerfil'
import { createClient } from "@/lib/supabase/server";
import { comprobarSuspension, rutaDeCuentaSuspendida } from "@/lib/auth/suspension";
import BetaBanner from "@/components/beta/BetaBanner";

/**
 * Este layout envuelve /dashboard Y /admin, así que es el sitio donde la comprobación
 * de suspensión cubre las dos zonas de una vez.
 *
 * POR QUE AQUI SI YA ESTA EN EL MIDDLEWARE
 *   Defensa en profundidad. Un middleware se salta de maneras que no son un ataque: un
 *   matcher que no cubre una ruta nueva, un parámetro de URL que lo cortocircuita —había
 *   uno, `?_p=1`—, un despliegue a medias. La comprobación que no se salta es la que
 *   está en el render de la página.
 */
export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const suspension = await comprobarSuspension(supabase, user.id);
    if (suspension.desviar) {
      redirect(rutaDeCuentaSuspendida(suspension.motivo));
    }
  }

  // Obtener perfil para verificar si es beta y su rol
  let showBetaBanner = false;
  if (user) {
    // is_beta no es una columna publica desde la 049: va por mi_perfil().
    const profile = await getMiPerfil();

    // Mostrar banner solo para usuarios beta que no sean admin
    showBetaBanner = !!profile?.is_beta && profile?.role !== 'admin';
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Banner solo para usuarios beta (no admins) */}
      {user && showBetaBanner && (
        <BetaBanner
          userEmail={user.email || ''}
          userId={user.id}
        />
      )}

      {children}
    </div>
  );
}
