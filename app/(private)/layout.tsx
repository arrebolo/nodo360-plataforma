// app/(private)/layout.tsx
import type { ReactNode } from "react";
import { getMiPerfil } from '@/lib/auth/miPerfil'
import { createClient } from "@/lib/supabase/server";
import BetaBanner from "@/components/beta/BetaBanner";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

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
